import logging

from core.audio.utils import delete_track_file

from core.models.payloads import EditArtistPayload, EditTrackPayload

from core.download.download_queue import DownloadQueue
from core.link.link_adapter import LinkAdapter
from core.youtube.youtube_client import YouTubeClient
from core.stats.stats_manager import StatsManager
from core.audio.processor import AudioProcessor
from database.database_manager import DatabaseManager

from sync.pokes import WSPokeFactory
from sync.websocket_manager import WebsocketManager

from core.download.exceptions import DownloadWorkerJobExpanded, DownloadWorkerJobFailed
from core.youtube.exceptions import YtdlpDownloadError, YtdlpTimeoutError

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
        stats_manager: StatsManager,
        link_adapter: LinkAdapter
    ):
        self.worker_id = worker_id

        self.dl_queue = dl_queue
        self.audio_processor = audio_processor
        self.yt_client = yt_client
        self.db_manager = db_manager
        self.ws_manager = ws_manager
        self.stats_manager = stats_manager
        self.link_adapter = link_adapter

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

                #determine the id to download
                if job.query:

                    #try extracting and parsing any possible links
                    generated_jobs, generated_payload = await self.link_adapter.expand_jobs(url=job.query)

                    if generated_jobs or generated_payload is not None:
                        if generated_payload is not None:
                            await self.db_manager.create_playlist(generated_payload)

                        for j in generated_jobs:
                            await self.dl_queue.add(j)
                        raise DownloadWorkerJobExpanded() #exit job handling here with a successful custom exception

                    #processing a single search query happens here
                    search_results = await self.yt_client.search_by_query(q=job.query, limit=job.query_limit)

                    if len(search_results) <= 0:
                        raise DownloadWorkerJobFailed() #exit job with failure
                        
                    search_id = search_results[0].id

                    if job.target_duration is None:
                        for sr in search_results:
                            await self.db_manager.register_track(sr)

                    else: #special attempt to get a result close to the target duration if specified
                        smallest_delta = float("inf")
                        for sr in search_results:
                            await self.db_manager.register_track(sr)

                            current_delta = abs(sr.duration - job.target_duration)
                            if current_delta < smallest_delta:
                                smallest_delta = current_delta
                                search_id = sr.id
                else:
                    search_id = job.track_id

                #perform the download, with an update fallback and retry on failure, and delete corrupted files on failure
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
                try:
                    await self.audio_processor.clean(file_path)
                    clean_duration = await self.audio_processor.get_duration(file_path)
                except Exception as e:
                    try:
                        delete_track_file(search_id)
                    except Exception:
                        pass
                    raise e
                
                #edit the track details
                await self.db_manager.register_track(download_result)
                await self.db_manager.register_download(download_result.id)

                estimated_title_display = job.title_display if job.title_display else download_result.display
                if job.artist_display:
                    artist_payload = [EditArtistPayload(name_display=job.artist_display)]
                else:
                    artist_payload = [
                        EditArtistPayload(name_display=artist.display)
                        for artist in download_result.artists
                    ]

                await self.db_manager.edit_track(
                    download_result.id, 
                    EditTrackPayload(
                        title_display=estimated_title_display,
                        duration=clean_duration,
                        artists=artist_payload,
                        playlist_ids=job.playlist_ids,
                    )
                )

                #play queue modification
                if job.to_queue:
                    if job.priority:
                        await self.db_manager.push_next_play_queue(download_result.id) #push to front of the play queue
                    else:
                        await self.db_manager.push_play_queue(download_result.id) #push to end of the play queue

                await self.db_manager.build_search_index()

                #status
                self.stats_manager.flag_audio_storage() #recalculate storage next time it's needed
                await self.dl_queue.complete_job(job.id, success=True)

                #poke the frontend with update status
                await self.ws_manager.broadcast(
                    WSPokeFactory.download_job_status_update(job)
                )
                logger.info(f"[{self.worker_id}] Successfully finished {job.identifier}")

            #playlist caught, expanded into new download jobs per song
            except DownloadWorkerJobExpanded as e:
                await self.dl_queue.complete_job(job.id, success=True)
                await self.ws_manager.broadcast(
                    WSPokeFactory.download_job_status_update(job)
                )
                logger.info(f"[{self.worker_id}] Successfully expanded jobs from {job.identifier}")

            #fall through error
            except Exception as e:
                await self.dl_queue.complete_job(job.id, success=False)
                await self.ws_manager.broadcast(
                    WSPokeFactory.download_job_status_update(job)
                )
                logger.error(f"[{self.worker_id}] Error: {str(e)}")

            finally:
                self.current_job = None

    def stop(self):
        self.is_running = False
