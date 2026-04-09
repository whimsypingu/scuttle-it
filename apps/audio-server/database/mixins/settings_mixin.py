import logging

logger = logging.getLogger(__name__)


class SettingsMixin:
    """Handles database synced settings"""

    async def set_loopmode(self, loopmode) -> bool:
        """Set the loopmode"""
        logger.info(f"Setting loopmode to {loopmode}")

        if (loopmode >= 3):
            logger.warning("Attempting to set loopmode to out of bounds range, skipping.")
            return False

        try:
            async with self.session() as db:
                await db.execute("UPDATE settings SET loopmode = ? WHERE id = 1;", (loopmode,))

                logger.info(f"Successfully set loopmode to {loopmode}")
                return True

        except Exception:
            logger.exception(f"Failed to set loopmode to {loopmode}")
            raise


    async def get_settings(self) -> dict:
        """Get the settings"""

        query = "SELECT loopmode FROM settings WHERE id = 1;"

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    row = await cursor.fetchone()

                    return dict(row)

        except Exception:
            logger.exception("Failed to retrieve Settings")
            raise
