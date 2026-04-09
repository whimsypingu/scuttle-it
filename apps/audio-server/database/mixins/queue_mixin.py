import logging

from database.mixins.mixin_utils import row_to_trackbase

from core.models.track import QueueTrack

logger = logging.getLogger(__name__)


class PlayQueueMixin:
    """Handles database backed play queue"""

    async def set_first_play_queue(self, track_id) -> bool:
        """Set and replace the first element of the Play Queue"""
        logger.info(f"Setting track_id {track_id} as the first entry in the Play Queue...")

        try: 
            async with self.session() as db:
                cursor = await db.execute('''
                    DELETE FROM play_queue
                    WHERE queue_id = (
                        SELECT queue_id
                        FROM play_queue
                        ORDER BY position
                        LIMIT 1
                    )
                    RETURNING position;
                ''')
                row = await cursor.fetchone() #returns None if empty
                first_position = row[0] if row is not None else 100.0

                await db.execute('''
                    INSERT INTO play_queue (track_id, position)
                    VALUES (?, ?);
                ''', (track_id, first_position))

                logger.info(f"Successfully set track_id {track_id} as the first entry of the Play Queue with position value: {first_position}")
                return True

        except Exception:
            logger.exception(f"Failed to set track_id {track_id} as the first entry of the Play Queue")
            raise


    async def reorder_queue(self, queue_id, new_position: float) -> bool:
        """Universal reordering: moves track to a new position. can be used for a loop all move to end"""
        logger.info(f"Reordering track with queue_id {queue_id} to position {new_position} in the Play Queue")

        try:
            async with self.session() as db:
                await db.execute("""
                    UPDATE play_queue
                    SET position = ?
                    WHERE queue_id = ?
                """, (queue_id, new_position))

                logger.info(f"Successfully reordered track with queue_id {queue_id} to position {new_position} in Play Queue")
                return True
        
        except Exception:
            logger.exception(f"Failed to reorder track with queue_id {queue_id} to position {new_position} in Play Queue")
            raise


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


    async def pop_play_queue(self, queue_id) -> bool:
        """Pop a specific item from the Play Queue"""
        logger.info(f"Popping track with queue_id {queue_id} the Play Queue...")

        try:
            async with self.session() as db:
                cursor = await db.execute("DELETE FROM play_queue WHERE queue_id = ?;", (queue_id,))
                if cursor.rowcount == 0:
                    logger.info(f"Track {queue_id} already gone or doesn't exist.")
                    return False
                    
                logger.info(f"Successfully popped {queue_id} from the Play Queue")
                return True

        except Exception:
            logger.exception(f"Failed to pop track {queue_id} from the Play Queue")
            raise


    async def get_play_queue(self) -> list[QueueTrack]:
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
                pq.queue_id,
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

                    return [
                        QueueTrack(
                            **row_to_trackbase(row).model_dump(),
                            queue_id=row["queue_id"],
                            position=row["position"]
                        ) for row in rows
                    ]

        except Exception:
            logger.exception("Failed to retrieve Play Queue contents")
            raise
