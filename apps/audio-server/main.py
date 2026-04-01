# Run this file from the project root directory with: [ python -m uvicorn apps.audio-server.main:app ]

import asyncio
import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from config import settings #triggers validation here

from api.routers.test_router import TestRouter
from api.routers.queue_router import QueueRouter
from api.routers.search_router import SearchRouter

from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.download.download_worker import DownloadWorker

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

    #global
    dl_queue = DownloadQueue()
    app.state.dl_queue = dl_queue

    workers = []
    for i in range(2):
        dl_worker = DownloadWorker(
            worker_id=f"Worker-{i+1}",
            dl_queue=dl_queue,
            yt_client=YouTubeClient(),
            db_manager=db_manager
        )
        workers.append(dl_worker)

        #start working in the background
        asyncio.create_task(dl_worker.run())

    await db_manager.build_from_directory()
    await db_manager.build_search_index()

    yield

    #shutdown
    for w in workers:
        w.stop()


app = FastAPI(
    title="Audio Server",
    description="Scuttle",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(TestRouter)
app.include_router(QueueRouter)
app.include_router(SearchRouter)


@app.get("/")
async def root():
    return {"message": "Audio Server is Live"}

@app.get("/status")
async def get_status():
    return {"status": "online", "version": "0.1.0"}



