# Run this file from the project root directory with: [ python -m uvicorn apps.audio-server.main:app --reload ]

import logging

from fastapi import FastAPI 
from contextlib import asynccontextmanager
from config import settings #triggers validation here

from core.youtube.youtube_client import YouTubeClient


logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-8s %(name)s - %(message)s"
)


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
    debug=settings.DEBUG,
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

@app.get("/test/download")
async def download(youtube_id: str):
    yt_client: YouTubeClient = app.state.yt_client
    await yt_client.download_by_youtube_id(youtube_id)