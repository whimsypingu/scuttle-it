import logging
import time

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
                ) AS artist_blob
                
                -- Scoring logic: BM25 * preferences * download boost
                sub.score * t.pref_weight * MAX(a.pref_weight) *
                    CASE WHEN d.id IS NOT NULL THEN 10.0 ELSE 1.0
                    END AS final_rank
            FROM (
                SELECT
                    rowid AS internal_id,
                    bm25(catalog_fts, 1.0, 1.5) AS score
                FROM catalog_fts
                WHERE catalog_fts MATCH ?
                LIMIT {internal_scan_limit}
            ) AS sub
            JOIN tracks t ON t.internal_id = sub.internal_id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON a.internal_id = ta.artist_internal_id
            LEFT JOIN downloads d ON d.id = t.id
            GROUP BY sub.internal_id
            ORDER BY final_rank ASC
            LIMIT {results_limit};
        '''

        try:
            async with self.session() as db:
                async with db.execute(query, (fts_query,)) as cursor:
                    rows = await cursor.fetchall()
                    
                    content = []
                    for row in rows:

                        #parse the artist blob back into ArtistBase objects
                        artists = []
                        for packet in row["artist_blob"].split(RECORD_SEP):
                            parts = packet.split(UNIT_SEP)
                            artists.append(ArtistBase(
                                internal_id=int(parts[0]),
                                id=parts[1] if parts[1] else None,
                                name=parts[2],
                                name_display=parts[3] if parts[3] else None
                            ))

                        #re-inflate into the TrackBase object (automatically type-casted)
                        content.append(TrackBase(
                            internal_id=row["internal_id"],
                            id=row["id"],
                            title=row["title"],
                            title_display=row["title_display"],
                            duration=row["duration"],
                            artists=artists
                        ))

                    return content
                
        except Exception:
            logger.exception(f"Failed to search query: {q}")
            raise

