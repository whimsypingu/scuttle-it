import logging

from fastapi.datastructures import State

from core.enrich.enrich_queue import EnrichQueue
from core.link.link_adapter import LinkAdapter
from core.youtube.youtube_client import YouTubeClient
from core.stats.stats_manager import StatsManager
from database.database_manager import DatabaseManager
from core.musicbrainz.musicbrainz_client import MusicBrainzClient

from sync.pokes import WSPokeFactory
from core.room.room_manager import RoomManager

from core.enrich.deduplication.minhash_lsh import MinhashLSH

from core.enrich.exceptions import EnrichWorkerJobExpanded, EnrichWorkerJobError
from core.youtube.exceptions import YtdlpTimeoutError

logger = logging.getLogger(__name__)


class EnrichWorker:
    def __init__(
        self,
        worker_id: str,
        yt_client: YouTubeClient,
        app_state: State,
    ):
        self.worker_id = worker_id

        self.yt_client = yt_client

        self.enr_queue: EnrichQueue = app_state.enr_queue
        self.db_manager: DatabaseManager = app_state.db_manager
        self.room_manager: RoomManager = app_state.room_manager
        self.stats_manager: StatsManager = app_state.stats_manager
        self.link_adapter: LinkAdapter = app_state.link_adapter
        self.mb_client: MusicBrainzClient = app_state.mb_client

        self.lsh = MinhashLSH()

        self.is_running = True
        self.current_job = None

    async def run(self):
        """Main loop for running this specific worker instance"""
        logger.info(f"[{self.worker_id}] Worker started.")

        while self.is_running:
            try:
                job = await self.enr_queue.get_next()
                self.current_job = job
                
                logger.info(f"[{self.worker_id}] Processing: {job.identifier}")

                #determine whether to expand into individual track queries
                if job.artist_id:

                    artist = await self.db_manager.retrieve_artist_details(job.artist_id)
 
                    # if artist.enriched_at < N:
                    #     continue

                    artist_tracks = await self.db_manager.retrieve_artist_tracks(artist.id)
                    for track in artist_tracks:
                        self.lsh.insert(track.display)

                    #extract further tracks and only add them if they are not rough duplicates
                    generated_jobs = await self.mb_client.enrich_artist(artist)
                    for j in generated_jobs:
                        if j.track and not self.lsh.match(j.track.display):
                            await self.enr_queue.add(j)

                    raise EnrichWorkerJobExpanded() #exit job handling here with a successful custom exception

                #take a track and replace the id
                else:
                    q = f"{job.track.display} by {' '.join(a.display for a in job.track.artists)}"
                    search_results = await self.yt_client.search_by_query(q=q, limit=3)

                    if len(search_results) <= 0:
                        raise EnrichWorkerJobError() #exit job with failure
                        
                    search_id = search_results[0].id

                    if job.target_duration is not None: #special attempt to get a result close to the target duration if specified
                        smallest_delta = float("inf")
                        for sr in search_results:
                            # await self.db_manager.register_track(sr)

                            current_delta = abs(sr.duration - job.target_duration)
                            if current_delta < smallest_delta:
                                smallest_delta = current_delta
                                search_id = sr.id

                    track = job.track
                    track.id = search_id

                    await self.db_manager.register_track(track)
                    await self.db_manager.build_search_index()

                #status
                await self.enr_queue.complete_job(job.id, success=True)

                logger.info(f"[{self.worker_id}] Successfully finished {job.identifier}")

            #playlist caught, expanded into new download jobs per song
            except EnrichWorkerJobExpanded as e:
                await self.enr_queue.complete_job(job.id, success=True)
                await self.room_manager.broadcast_all(
                    WSPokeFactory.download_job_status_update(job)
                )
                logger.info(f"[{self.worker_id}] Successfully expanded jobs from {job.identifier}")

            #fall through error
            except Exception as e:
                await self.enr_queue.complete_job(job.id, success=False)
                logger.error(f"[{self.worker_id}] Error: {str(e)}")

            finally:
                self.current_job = None

    def stop(self):
        self.is_running = False
