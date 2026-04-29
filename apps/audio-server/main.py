# Run this file from the project root directory with:

# python -m uvicorn apps.audio-server.main:app

import asyncio
import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from config import settings #triggers validation here

from api.routers.test_router import TestRouter

from api.routers.audio_router import AudioRouter
from api.routers.queue_router import QueueRouter
from api.routers.retrieval_router import RetrievalRouter
from api.routers.search_router import SearchRouter
from api.routers.settings_router import SettingsRouter
from api.routers.websocket_router import WebsocketRouter
from api.routers.edit_router import EditRouter
from api.routers.like_router import LikeRouter

from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager
from sync.websocket_manager import WebsocketManager
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

    ws_manager = WebsocketManager()
    app.state.ws_manager = ws_manager

    #global
    dl_queue = DownloadQueue()
    app.state.dl_queue = dl_queue

    workers = []
    for i in range(2):
        dl_worker = DownloadWorker(
            worker_id=f"Worker-{i+1}",
            dl_queue=dl_queue,
            yt_client=YouTubeClient(),
            db_manager=db_manager,
            ws_manager=ws_manager
        )
        workers.append(dl_worker)

        #start working in the background
        asyncio.create_task(dl_worker.run())

    await db_manager.build_from_directory()
    await db_manager.build_search_index()
    await db_manager.normalize_play_queue_positions()

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

app.include_router(AudioRouter)
app.include_router(QueueRouter)
app.include_router(RetrievalRouter)
app.include_router(SearchRouter)
app.include_router(SettingsRouter)
app.include_router(WebsocketRouter)
app.include_router(EditRouter)
app.include_router(LikeRouter)

@app.get("/status")
async def get_status():
    return {"status": "online", "version": "0.1.0"}

app.mount("/", StaticFiles(directory=(settings.DIST_DIR), html=True), name="static")




