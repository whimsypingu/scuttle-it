import logging
import time

from database.mixins.mixin_utils import results_to_trackbase_list

from core.models.artist import ArtistBase
from core.models.track import TrackBase

logger = logging.getLogger(__name__)


class PlayQueueMixin:
    """Handles database backed play queue"""

    async def push_play_queue(self, track_id) -> bool:
        """Push to the end of the Play Queue"""
        logger.info(f"Pushing track_id {track_id} to the end of the Play Queue...")

        try:
            async with self.session() as db:
                cursor = await db.execute("SELECT COALESCE(MAX(position), 0.0) FROM play_queue;")
                row = await cursor.fetchone()
                current_max = row[0]

                new_position = current_max + 100.0
                
                #insert
                await db.execute('''
                    INSERT INTO play_queue (track_id, position)
                    VALUES (?, ?);
                ''', (track_id, new_position))

                logger.info(f"Successfully pushed track_id {track_id} to the end of the Play Queue with position value: {new_position}")
                return True
        
        except Exception:
            logger.exception(f"Failed to push track_id {track_id} to end of the Play Queue")
            raise

    async def pop_play_queue(self) -> bool:
        """Pop from the front of the Play Queue"""
        logger.info(f"Popping from the front of the Play Queue...")

        query = f'''
            DELETE FROM play_queue
            WHERE position = (
                SELECT MIN(position)
                FROM play_queue
            );
        '''

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    if cursor.rowcount == 0:
                        logger.info("Play Queue is empty, nothing to pop.")
                        return False
                    
                    logger.info("Successfully popped the first track from the Play Queue")
                    return True

        except Exception:
            logger.exception(f"Failed to pop first track from the Play Queue")
            raise


    async def get_play_queue(self) -> list[TrackBase]:
        """Retrieve the full play queue with all metadata"""

        UNIT_SEP = "\x1f"
        RECORD_SEP = "\x1e"

        query = f'''
            SELECT
                -- TrackBase fields
                t.internal_id,
                t.id,
                t.title,
                t.title_display,
                t.duration,

                -- ArtistBase fields
                GROUP_CONCAT(
                    a.internal_id || '{UNIT_SEP}' ||
                    COALESCE(a.id, '') || '{UNIT_SEP}' ||
                    a.name || '{UNIT_SEP}' ||
                    COALESCE(a.name_display, ''), 
                    '{RECORD_SEP}'
                ) AS artist_blob,

                -- Position
                pq.position
            FROM play_queue pq
            JOIN tracks t ON pq.track_id = t.id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON a.internal_id = ta.artist_internal_id
            GROUP BY pq.position
            ORDER BY pq.position ASC;
        '''

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    rows = await cursor.fetchall()
                    return results_to_trackbase_list(rows)

        except Exception:
            logger.exception("Failed to retrieve Play Queue contents")
            raise
