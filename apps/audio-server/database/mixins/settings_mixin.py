import logging

logger = logging.getLogger(__name__)


class SettingsMixin:
    """Handles database synced settings"""

    async def set_loopmode(self, loopmode, room_id) -> bool:
        """Set the loopmode"""
        logger.info(f"Setting loopmode to {loopmode} in room {room_id}")

        if (loopmode > 2 or loopmode < 0):
            logger.warning("Attempting to set loopmode to out of bounds range, skipping.")
            return False

        try:
            async with self.session() as db:
                await db.execute("UPDATE rooms SET loopmode = ? WHERE id = ?;", (loopmode, room_id))

                logger.info(f"Successfully set loopmode to {loopmode}")
                return True

        except Exception:
            logger.exception(f"Failed to set loopmode to {loopmode}")
            raise


    async def get_settings(self, room_id) -> dict:
        """Get the settings"""
        logger.info(f"Retrieving settings for room {room_id}")

        query = "SELECT loopmode FROM rooms WHERE id = ?;"
        params = (room_id,)

        try:
            async with self.session() as db:
                async with db.execute(query, params) as cursor:
                    row = await cursor.fetchone()

                    return dict(row)

        except Exception:
            logger.exception("Failed to retrieve Settings")
            raise

    
    async def set_username(self, username) -> bool:
        """Set the username"""
        logger.info(f"Setting username to {username}")

        if (len(username) <= 0):
            return False
        
        try:
            async with self.session() as db:
                await db.execute("UPDATE settings SET username = ? WHERE id = 1;", (username,))

                logger.info(f"Successfully set username to {username}")
                return True
            
        except Exception:
            logger.exception(f"Failed to set username to {username}")
            raise
