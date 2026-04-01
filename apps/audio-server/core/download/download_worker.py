import asyncio
import logging

from core.download.download_queue import DownloadQueue
from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager

logger = logging.getLogger(__name__)


class DownloadWorker:
    def __init__(
        self,
        worker_id: str,
        dl_queue: DownloadQueue,
        yt_client: YouTubeClient,
        db_manager: DatabaseManager
    ):
        self.worker_id = worker_id

        self.dl_queue = dl_queue
        self.yt_client = yt_client
        self.db_manager = db_manager

        self.is_running = True
        self.current_job = None

    async def run(self):
        """Main loop for running this specific worker instance"""
        logger.info(f"[{self.worker_id}] Worker started.")

        while self.is_running:
            try:
                job = await self.dl_queue.get_next()
                self.current_job = job
                
                logger.info(f"[{self.worker_id}] Processing: {job.identifier}")

                if job.query:
                    #register tracks
                    search_results = await self.yt_client.search_by_query(q=job.query, limit=job.query_limit)
                    for search_result in search_results:
                        await self.db_manager.register_track(search_result)
                    await self.db_manager.build_search_index()

                    #register download
                    top_search_result = search_results[0]
                    await self.yt_client.download_by_youtube_id(top_search_result.id)
                    await self.db_manager.register_download(top_search_result.id)
                else:
                    await self.yt_client.download_by_youtube_id(job.track_id)

                logger.info(f"[{self.worker_id}] Successfully finished {job.identifier}")

            except Exception as e:
                logger.error(f"[{self.worker_id}] Error: {str(e)}")
            
            finally:
                self.current_job = None

    def stop(self):
        self.is_running = False
