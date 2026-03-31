# Run this file from the project root directory with: [ python -m uvicorn apps.audio-server.main:app ]

import asyncio
import logging

from fastapi import FastAPI, HTTPException 
from contextlib import asynccontextmanager

from config import settings #triggers validation here

from api.routers.test_router import TestRouter
from api.routers.queue_router import QueueRouter

from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager


from core.youtube.youtube_exceptions import YtdlpDownloadError, YtdlpMetadataError, YtdlpTimeoutError, YtdlpUpdateError
from core.models.artist import ArtistBase
from core.models.track import TrackBase



logging.basicConfig(
    level=logging.INFO,
    format="\033[32m%(asctime)s\033[0m %(levelname)-8s \033[34m%(name)s\033[0m - %(message)s",
    datefmt="%H:%M:%S"
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db_manager = DatabaseManager()
    app.state.db_manager = db_manager

    yt_client = YouTubeClient()
    app.state.yt_client = yt_client

    await db_manager.build_from_directory()

    await db_manager.register_track(TrackBase(
        id="track_id_1",
        title="never gonna give you up",
        title_display="Never Gonna Give You Up",
        duration=212.0,
        artists=[ArtistBase(
            id="artist_id_1",
            name="rick astley",
            name_display="Rick Astley"
        )]
    ))
    await db_manager.build_search_index()
    yield


app = FastAPI(
    title="Audio Server",
    description="Scuttle",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(TestRouter)
app.include_router(QueueRouter)

@app.get("/")
async def root():
    return {"message": "Audio Server is Live"}

@app.get("/status")
async def get_status():
    return {"status": "online", "version": "0.1.0"}



@app.get("/test/search")
async def search():
    db_manager: DatabaseManager = app.state.db_manager 
    result = await db_manager.search("never")
    return {"result": result}


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
