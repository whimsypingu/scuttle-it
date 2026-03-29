# Run this file from the project root directory with: [ python -m uvicorn apps.audio-server.main:app --reload ]

import asyncio
import logging

from core.youtube.youtube_exceptions import YtdlpDownloadError, YtdlpMetadataError, YtdlpTimeoutError, YtdlpUpdateError
from fastapi import FastAPI, HTTPException 
from contextlib import asynccontextmanager
from config import settings #triggers validation here

from core.youtube.youtube_client import YouTubeClient


logging.basicConfig(
    level=logging.INFO,
    format="\033[32m%(asctime)s\033[0m %(levelname)-8s \033[34m%(name)s\033[0m - %(message)s",
    datefmt="%H:%M:%S"
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yt_client = YouTubeClient(
        name="ScuttleDownloader",
        base_dir=settings.BIN_DIR
    )

    app.state.yt_client = yt_client

    yield


app = FastAPI(
    title="Audio Server",
    description="Scuttle",
    version="0.1.0",
    lifespan=lifespan
)

@app.get("/")
async def root():
    return {"message": "Audio Server is Live"}

@app.get("/status")
async def get_status():
    return {"status": "online", "version": "0.1.0"}

@app.get("/test/ytdlp-version")
async def get_version():
    yt_client: YouTubeClient = app.state.yt_client
    code, out, err = await yt_client._run_command(["yt-dlp", "--version"])

    if code == 0:
        return {"version": out}
    return {"error": err, "exit_code": code}

@app.get("/test/update")
async def update():
    yt_client: YouTubeClient = app.state.yt_client
    await yt_client.update()

@app.post("/test/download/{youtube_id}")
async def download(youtube_id: str):
    yt_client: YouTubeClient = app.state.yt_client

    try:
        #first attempt
        return await yt_client.download_by_youtube_id(youtube_id)

    except YtdlpDownloadError:
        logger.error("Download failed once:", exc_info=True)
        
        try:
            #try to fix the environment and retry download
            await yt_client.update()
            await asyncio.sleep(1)
            return await yt_client.download_by_youtube_id(youtube_id)
        
        except YtdlpUpdateError:
            raise HTTPException(
                status_code=500,
                detail="yt-dlp update failed"
            )
        
        except YtdlpDownloadError:
            raise HTTPException(
                status_code=500,
                detail="Download failed after updating yt-dlp"
            )

    except YtdlpTimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Download timed out"
        )

    except YtdlpMetadataError:
        raise HTTPException(
            status_code=502,
            detail="Could not parse video metadata after extraction"
        )
