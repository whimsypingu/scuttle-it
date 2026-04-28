import logging

logger = logging.getLogger(__name__)


class LikeMixin:
    """Handles database backed play queue"""

    async def like(self, track_id: str) -> bool:
        """Like a track"""
        logger.info(f"Liking track_id: {track_id}...")

        try: 
            async with self.session() as db:
                await db.execute('''
                    INSERT OR IGNORE INTO likes (track_internal_id, position)
                    SELECT internal_id, (SELECT COALESCE(MAX(position), 0) + 1.0 FROM likes)
                    FROM tracks
                    WHERE id = ?;
                ''', (track_id,))

                logger.info(f"Successfully liked track_id {track_id}")
                return True

        except Exception:
            logger.exception(f"Failed to like track_id {track_id}")
            raise


    async def unlike(self, track_id: str) -> bool:
        """Unlike a track"""
        logger.info(f"Unliking track_id: {track_id}...")

        try: 
            async with self.session() as db:
                await db.execute('''
                    DELETE FROM likes
                    WHERE track_internal_id = (
                        SELECT internal_id FROM tracks WHERE id = ?
                    );
                ''', (track_id,))

                logger.info(f"Successfully unliked track_id {track_id}")
                return True

        except Exception:
            logger.exception(f"Failed to unlike track_id {track_id}")
            raise

