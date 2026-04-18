import logging
import time

from database.mixins.mixin_utils import row_to_trackbase

from core.models.artist import ArtistBase
from core.models.track import TrackBase

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

    
    async def search(self, q: str) -> list[TrackBase]:
        """
        Search for tracks with priority ranking for downloaded content.
        """
        if not q:
            return []
        
        #prepare fts query (prefix matching on all tokens)
        tokens = q.split()
        fts_query = " AND ".join(f"{t}*" for t in tokens)

        internal_scan_limit = 1000 #how many to ensure we catch all relevant downloads to reduce the number of JOIN operations
        results_limit = 30

        UNIT_SEP = "\x1f"
        RECORD_SEP = "\x1e"

        query = f'''
            WITH candidates AS (
                -- FTS lookup and scoring
                SELECT
                    t.internal_id,
                    t.id,
                    t.pref_weight AS track_pref,
                    sub.score,
                    CASE WHEN d.track_internal_id IS NOT NULL THEN 10.0 ELSE 1.0 END AS dl_boost
                FROM (
                    SELECT 
                        rowid AS row_id,
                        bm25(catalog_fts, 1.0, 1.5) AS score
                    FROM catalog_fts
                    WHERE catalog_fts MATCH ?
                    LIMIT {internal_scan_limit}
                ) AS sub
                JOIN tracks t ON t.internal_id = sub.row_id
                LEFT JOIN downloads d ON d.track_internal_id = t.internal_id
            ),
            ranked_track_ids AS (
                -- Finalize ranking
                SELECT
                    c.internal_id,
                    c.score * c.track_pref * MAX(COALESCE(a.pref_weight, 1.0)) * c.dl_boost AS final_rank
                FROM candidates c
                JOIN track_artists ta ON ta.track_internal_id = c.internal_id
                JOIN artists a ON a.internal_id = ta.artist_internal_id
                GROUP BY c.internal_id
                ORDER BY final_rank ASC
                LIMIT {results_limit}
            )
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

                r.final_rank
            FROM ranked_track_ids r
            JOIN tracks t ON t.internal_id = r.internal_id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON a.internal_id = ta.artist_internal_id
            GROUP BY t.internal_id
            ORDER BY r.final_rank ASC;
        '''

        try:
            async with self.session() as db:
                async with db.execute(query, (fts_query,)) as cursor:
                    rows = await cursor.fetchall()
                    return [
                        row_to_trackbase(row) for row in rows
                    ]
                
        except Exception:
            logger.exception(f"Failed to search query: {q}")
            raise
