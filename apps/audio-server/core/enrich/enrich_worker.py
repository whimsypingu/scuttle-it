import logging

from core.models.payloads import EditArtistPayload
from fastapi.datastructures import State

from core.enrich.enrich_queue import EnrichQueue
from core.link.link_adapter import LinkAdapter
from core.youtube.youtube_client import YouTubeClient
from core.stats.stats_manager import StatsManager
from database.database_manager import DatabaseManager
from core.musicbrainz.musicbrainz_client import MusicBrainzClient
from core.room.room_manager import RoomManager

from core.enrich.deduplication.minhash_lsh import MinhashLSH

from core.utils import current_timestamp

from core.enrich.exceptions import EnrichWorkerJobSkipped

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

                self.lsh.reset()

                #handling a new artist that has no existing entry yet shouldn't happen in the first place
                artist = await self.db_manager.retrieve_artist_details(job.artist_id)

                if (current_timestamp() - artist.enriched_at) < self.enr_queue.ENRICH_EXPIRE_TIME:
                    raise EnrichWorkerJobSkipped()

                artist_tracks = await self.db_manager.retrieve_artist_tracks(artist.id)
                for track in artist_tracks:
                    self.lsh.insert(track.display)

                #extract further tracks and only add them if they are not rough duplicates
                generated_tracks = await self.mb_client.enrich_artist(artist)
                for track in generated_tracks:
                    if not self.lsh.match(track.display):
                        await self.db_manager.register_track(track)

                await self.db_manager.build_search_index()
                await self.db_manager.edit_artist(
                    job.artist_id, 
                    EditArtistPayload(
                        enriched_at=current_timestamp()
                    )
                )

                #status
                await self.enr_queue.complete_job(job.id, success=True)

                logger.info(f"[{self.worker_id}] Successfully finished {job.identifier}")

            #skipped artist enrichment
            except EnrichWorkerJobSkipped as e:
                await self.enr_queue.complete_job(job.id, success=True)
                logger.info(f"[{self.worker_id}] Skipped enrichment: {job.identifier}")

            #fall through error
            except Exception as e:
                await self.enr_queue.complete_job(job.id, success=False)
                logger.error(f"[{self.worker_id}] Error: {str(e)}")

            finally:
                self.current_job = None

    def stop(self):
        self.is_running = False
