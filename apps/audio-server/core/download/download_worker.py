import logging

from core.audio.processor import AudioProcessor
from core.audio.utils import delete_track_file
from core.download.download_queue import DownloadQueue
from core.models.payloads import EditArtistPayload, EditTrackPayload
from core.youtube.youtube_client import YouTubeClient
from core.youtube.youtube_exceptions import YtdlpDownloadError, YtdlpTimeoutError
from database.database_manager import DatabaseManager
from sync.pokes import WSPokeFactory
from sync.websocket_manager import WebsocketManager
from core.stats.stats_manager import StatsManager

logger = logging.getLogger(__name__)


class DownloadWorker:
    def __init__(
        self,
        worker_id: str,
        dl_queue: DownloadQueue,
        audio_processor: AudioProcessor,
        yt_client: YouTubeClient,
        db_manager: DatabaseManager,
        ws_manager: WebsocketManager,
        stats_manager: StatsManager
    ):
        self.worker_id = worker_id

        self.dl_queue = dl_queue
        self.audio_processor = audio_processor
        self.yt_client = yt_client
        self.db_manager = db_manager
        self.ws_manager = ws_manager
        self.stats_manager = stats_manager

        self.is_running = True
        self.current_job = None

    async def run(self):
        """Main loop for running this specific worker instance"""
        logger.info(f"[{self.worker_id}] Worker started.")

        while self.is_running:
            try:
                job = await self.dl_queue.get_next()
                self.current_job = job
                
                #poke the frontend with update status
                await self.ws_manager.broadcast(
                    WSPokeFactory.download_job_status_update(job)
                )
                logger.info(f"[{self.worker_id}] Processing: {job.identifier}")

                if job.query:
                    #register tracks
                    search_results = await self.yt_client.search_by_query(q=job.query, limit=job.query_limit)
                    for search_result in search_results:
                        await self.db_manager.register_track(search_result)
                    search_id = search_results[0].id
                else:
                    search_id = job.track_id

                try:
                    try:
                        download_result, file_path = await self.yt_client.download_by_youtube_id(search_id, parse=True)
                    except (YtdlpDownloadError, YtdlpTimeoutError) as e:
                        logger.warning("Download failed. Updating ytdlp and retrying...")
                        await self.yt_client.update()
            
                        download_result, file_path = await self.yt_client.download_by_youtube_id(search_id, parse=True)
                except Exception as e:
                    logger.error(f"Download failed a second time after client update: {e}")
                    try:
                        delete_track_file(search_id)
                    except Exception:
                        pass
                    raise e

                #clean audio file
                await self.audio_processor.clean(file_path)
                clean_duration = await self.audio_processor.get_duration(file_path)
                
                #edit the track details
                await self.db_manager.register_track(download_result)
                await self.db_manager.register_download(download_result.id)

                await self.db_manager.edit_track(
                    download_result.id, 
                    EditTrackPayload(
                        title_display=download_result.display,
                        duration=clean_duration,
                        artists=[EditArtistPayload(
                            name_display=artist.display
                        ) for artist in download_result.artists]
                    )
                )

                await self.db_manager.push_next_play_queue(download_result.id) #push to play queue immediately for now

                await self.db_manager.build_search_index()

                #status
                self.stats_manager.flag_audio_storage() #recalculate storage next time it's needed
                await self.dl_queue.complete_job(job.id, success=True)

                #poke the frontend with update status
                await self.ws_manager.broadcast(
                    WSPokeFactory.download_job_status_update(job)
                )
                logger.info(f"[{self.worker_id}] Successfully finished {job.identifier}")

            except Exception as e:
                #status
                await self.dl_queue.complete_job(job.id, success=False)
            
                await self.ws_manager.broadcast(
                    WSPokeFactory.download_job_status_update(job)
                )
                logger.error(f"[{self.worker_id}] Error: {str(e)}")

            finally:
                self.current_job = None

    def stop(self):
        self.is_running = False
