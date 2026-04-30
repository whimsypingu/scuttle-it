import logging
import time
from typing import Literal

from database.mixins.mixin_utils import row_to_playlist_track, row_to_trackbase

from core.models.artist import ArtistBase
from core.models.track import PlaylistTrack, TrackBase

logger = logging.getLogger(__name__)


class RetrievalMixin:
    """Handles database retrievals"""

    #DOWNLOADS
    async def count_downloads(self) -> int:
        """Total number of downloaded tracks"""
        try:
            async with self.session() as db:
                async with db.execute("SELECT COUNT(*) FROM downloads") as cursor:
                    row = await cursor.fetchone()
                    return row[0] if row else 0
        except Exception:
            logger.exception("Failed to retrieve Download contents")
            raise


    async def retrieve_downloads(self, offset: int, limit: int) -> list[TrackBase]:
        """Retrieve a sublist of tracks from the Downloads table"""
        logger.info(f"Retrieving tracks from Downloads with offset {offset} and limit {limit}")

        UNIT_SEP = "\x1f"
        RECORD_SEP = "\x1e"

        query = f'''
            WITH downloaded_subset_tracks AS (
                -- Get track subset
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
            FROM downloaded_subset_tracks d
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
        


    #LIKES
    async def count_likes(self) -> int:
        """Total number of liked tracks"""
        try:
            async with self.session() as db:
                async with db.execute("SELECT COUNT(*) FROM likes") as cursor:
                    row = await cursor.fetchone()
                    return row[0] if row else 0
        except Exception:
            logger.exception("Failed to retrieve Liked contents")
            raise


    async def retrieve_likes(self, offset: int, limit: int, sortmode: int) -> list[PlaylistTrack]:
        """Retrieve a sublist of tracks from the Likes table""" #change sort_by field to enum
        logger.info(f"Retrieving Liked tracks with offset {offset} and limit {limit} with sortmode {sortmode}")

        #see: apps/audio-server/api/routers/retrieval_router.py for mapping
        SORT_MAP = {
            0: "position ASC",
            1: "liked_at DESC",
        }

        UNIT_SEP = "\x1f"
        RECORD_SEP = "\x1e"

        query = f'''
            WITH liked_subset_tracks AS (
                -- Get track subset
                SELECT * 
                FROM likes
                ORDER BY {SORT_MAP[sortmode]}
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
                ) AS artist_blob,

                l.liked_at AS added_at,
                l.position
            FROM liked_subset_tracks l
            JOIN tracks t ON t.internal_id = l.track_internal_id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON ta.artist_internal_id = a.internal_id
            GROUP BY t.internal_id
            ORDER BY l.{SORT_MAP[sortmode]};
        '''

        try: 
            async with self.session() as db:
                params = {"limit": limit, "offset": offset} #sql safety
                async with db.execute(query, params) as cursor:
                    rows = await cursor.fetchall()
                    return [
                        row_to_playlist_track(row) for row in rows
                    ]

        except Exception:
            logger.exception("Failed to retrieve Liked contents")
            raise
        
