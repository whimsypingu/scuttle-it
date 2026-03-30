import logging

logger = logging.getLogger(__name__)

class SeedMixin:
    """Handles initial database schema creation and table seeding"""

    async def build_from_directory(self):
        """Reads .sql files and executes it in increasing filename order"""
        sql_files = sorted(self.sql_dir.glob("*.sql"))

        try:
            async with self.session() as db:
                for sql_file in sql_files:
                    logger.info(f"Executing {sql_file.name}...")
                    with open(sql_file, "r") as f:
                        script = f.read()
                        await db.executescript(script)

        except Exception:
            logger.exception(f"Failed to build database from directory: {self.sql_dir}")
            raise
