import logging

logger = logging.getLogger(__name__)


class MaintenanceMixin:
    """Handles database maintenance operations"""

    async def normalize_play_queue_positions(self) -> bool: 
        """Re-normalize all queue positions in the Play Queue"""
        logger.info(f"Normalizing Play Queue positions...")

        try:
            async with self.session() as db:
                await db.execute("CREATE TEMP TABLE temp_play_queue AS SELECT * FROM play_queue;") #copy to temp table

                await db.execute("DELETE FROM play_queue;") #clear contents of play queue

                #insert into the play queue with normalized positions, this assigns a new play_queue.queue_id
                await db.execute('''
                    INSERT INTO play_queue (track_internal_id, position, added_at)
                    SELECT
                        track_internal_id,
                        ROW_NUMBER() OVER (ORDER BY position) * 100,
                        added_at
                    FROM temp_play_queue;
                ''')

                await db.execute("DROP TABLE temp_play_queue;") #delete just in case, although TEMP should handle that

                logger.info(f"Successfully normalized Play Queue positions")
                return True
        
        except Exception:
            logger.exception(f"Failed to normalize Play Queue positions")
            raise
