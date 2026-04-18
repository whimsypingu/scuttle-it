import logging
import time

from database.mixins.mixin_utils import row_to_trackbase

from core.models.artist import ArtistBase
from core.models.track import TrackBase

logger = logging.getLogger(__name__)


class RetrievalMixin:
    """Handles database retrievals"""

    async def retrieve_downloads(self, offset: int, limit: int) -> list[TrackBase]:
        """Retrieve a sublist of tracks from the Downloads table"""
        logger.info(f"Retrieving tracks from Downloads with offset {offset} and limit {limit}")

        UNIT_SEP = "\x1f"
        RECORD_SEP = "\x1e"

        query = f'''
            WITH download_tracks AS (
                -- Get track sublist
                SELECT * 
                FROM downloads
                ORDER BY downloaded_at DESC
                LIMIT :limit OFFSET :offset
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
                ) AS artist_blob
            FROM download_tracks d
            JOIN tracks t ON t.internal_id = d.track_internal_id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON ta.artist_internal_id = a.internal_id
            GROUP BY t.internal_id
            ORDER BY d.downloaded_at DESC;
        '''

        try: 
            async with self.session() as db:
                params = {"limit": limit, "offset": offset} #sql safety
                async with db.execute(query, params) as cursor:
                    rows = await cursor.fetchall()
                    return [
                        row_to_trackbase(row) for row in rows
                    ]

        except Exception:
            logger.exception("Failed to retrieve Download contents")
            raise
        
