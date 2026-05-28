# Run this file from the project root directory with:

# python -m uvicorn apps.audio-server.main:app --host 0.0.0.0 --port 8000

import asyncio
import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from config import settings #triggers validation here

from api.routers.test_router import TestRouter

from api.routers.audio_router import AudioRouter
from api.routers.queue_router import QueueRouter
from api.routers.track_router import TrackRouter
from api.routers.playlist_router import PlaylistRouter
from api.routers.retrieval_router import RetrievalRouter
from api.routers.search_router import SearchRouter
from api.routers.settings_router import SettingsRouter
from api.routers.websocket_router import WebsocketRouter
from api.routers.like_router import LikeRouter
from api.routers.job_router import JobRouter
from api.routers.stats_router import StatsRouter

from core.youtube.youtube_client import YouTubeClient
from core.audio.processor import AudioProcessor
from database.database_manager import DatabaseManager
from sync.websocket_manager import WebsocketManager
from core.download.download_queue import DownloadQueue
from core.download.download_worker import DownloadWorker
from core.stats.stats_manager import StatsManager
from core.link.link_adapter import LinkAdapter

logging.basicConfig(
    level=logging.INFO,
    format="\033[32m%(asctime)s\033[0m %(levelname)-8s \033[34m%(name)s\033[0m - %(message)s",
    datefmt="%H:%M:%S"
)
logging.getLogger("asyncio").setLevel(logging.CRITICAL)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_manager = DatabaseManager()
    app.state.db_manager = db_manager

    ws_manager = WebsocketManager()
    app.state.ws_manager = ws_manager

    stats_manager = StatsManager(
        flush_interval=300, #how frequently to flush stats
        db_manager=db_manager,
        ws_manager=ws_manager
    )
    app.state.stats_manager = stats_manager

    link_adapter = LinkAdapter()
    app.state.link_adapter = link_adapter

    #global
    dl_queue = DownloadQueue()
    app.state.dl_queue = dl_queue

    audio_processor = AudioProcessor()
    app.state.audio_processor = audio_processor

    workers = []
    for i in range(2):
        dl_worker = DownloadWorker(
            worker_id=f"Worker-{i+1}",
            dl_queue=dl_queue,
            audio_processor=audio_processor,
            yt_client=YouTubeClient(),
            db_manager=db_manager,
            ws_manager=ws_manager,
            stats_manager=stats_manager,
            link_adapter=link_adapter,
        )
        workers.append(dl_worker)

        #start working in the background
        asyncio.create_task(dl_worker.run())

    #poll every interval seconds to flush stats into the database
    asyncio.create_task(stats_manager.run())

    await db_manager.build_from_directory()
    await db_manager.build_search_index()
    await db_manager.normalize_play_queue_positions()

    yield

    #shutdown
    for w in workers:
        w.stop()
    stats_manager.stop()


app = FastAPI(
    title="Audio Server",
    description="Scuttle",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(TestRouter)

app.include_router(AudioRouter)
app.include_router(QueueRouter)
app.include_router(TrackRouter)
app.include_router(PlaylistRouter)
app.include_router(RetrievalRouter)
app.include_router(SearchRouter)
app.include_router(SettingsRouter)
app.include_router(WebsocketRouter)
app.include_router(LikeRouter)
app.include_router(JobRouter)
app.include_router(StatsRouter)

@app.get("/status")
async def get_status():
    return {"status": "online", "version": "0.1.0"}

app.mount("/", StaticFiles(directory=(settings.DIST_DIR), html=True), name="static")




