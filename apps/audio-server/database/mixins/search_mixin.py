import logging
import time

logger = logging.getLogger(__name__)

class SearchMixin:
    """Handles database search"""

    async def build_search_index(self) -> True:
        """Manually synchronize the FTS5 index with the current state of the Tracks and Artists tables."""
        logger.info("Synchronizing search index with database...")
        start_time = time.perf_counter()

        try:
            async with self.session() as db:
                #clear the current index
                await db.execute("INSERT INTO catalog_fts(catalog_fts) VALUES('delete-all');")

                #re-populate from the defined content view
                await db.execute("INSERT INTO catalog_fts(catalog_fts) VALUES('rebuild');")

            duration = time.perf_counter() - start_time
            logger.info(f"FTS5 index updated successfully in {duration:.3f}s")
            return True
        
        except Exception:
            logger.exception("Failed to rebuild FTS5 search index")
            raise