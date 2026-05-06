import logging

from core.models.playlist import PlaylistDetails
from database.mixins.mixin_utils import row_to_playlist_details, row_to_playlist_track, row_to_track_details, row_to_trackbase

from core.models.artist import ArtistBase
from core.models.track import PlaylistTrack, TrackBase, TrackDetails

logger = logging.getLogger(__name__)


class RetrievalMixin:
    """Handles database retrievals"""

    #DOWNLOADS
    async def retrieve_downloads_stats(self) -> dict:
        """Total number and duration of downloaded tracks""" #consider caching this kind of stuff as a view?

        query = f'''
            SELECT
                COUNT(d.track_internal_id) as total_count,
                COALESCE(SUM(t.duration), 0) as total_duration
            FROM downloads d
            JOIN tracks t ON t.internal_id = d.track_internal_id;
        '''
        
        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    row = await cursor.fetchone() #gets a row with (total_count, total_duration)
                    return {
                        "total_count": row["total_count"] if row else 0,
                        "total_duration": row["total_duration"] if row else 0,
                    }
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
    async def retrieve_likes_stats(self) -> dict:
        """Total number and duration of liked tracks"""
        
        query = f'''
            SELECT
                COUNT(l.track_internal_id) as total_count,
                COALESCE(SUM(t.duration), 0) as total_duration
            FROM likes l
            JOIN tracks t ON t.internal_id = l.track_internal_id;
        '''

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    row = await cursor.fetchone() #gets a row with (total_count, total_duration)
                    return {
                        "total_count": row["total_count"] if row else 0,
                        "total_duration": row["total_duration"] if row else 0,
                    }
        except Exception:
            logger.exception("Failed to retrieve Liked contents")
            raise


    async def retrieve_likes(self, offset: int, limit: int, sortmode: int) -> list[PlaylistTrack]:
        """Retrieve a sublist of tracks from the Likes table"""
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
        


    #PLAYLISTS
    async def retrieve_playlist_stats(self, playlist_id) -> dict:
        """Total number and duration of playlist tracks""" #consider caching this kind of stuff as a view?

        query = f'''
            SELECT
                COUNT(pt.track_internal_id) as total_count,
                COALESCE(SUM(t.duration), 0) as total_duration
            FROM playlist_tracks pt
            JOIN playlists p ON p.internal_id = pt.playlist_internal_id
            JOIN tracks t ON t.internal_id = pt.track_internal_id
            WHERE p.id = ?;
        '''
        
        try:
            async with self.session() as db:
                async with db.execute(query, (playlist_id,)) as cursor:
                    row = await cursor.fetchone() #gets a row with (total_count, total_duration)
                    # return dict(row) if row else {"total_count": 0, "total_duration": 0} #unpack like this
                    return {
                        "total_count": row["total_count"] if row else 0,
                        "total_duration": row["total_duration"] if row else 0,
                    }
        except Exception:
            logger.exception("Failed to retrieve Playlist contents")
            raise


    async def retrieve_playlist(self, playlist_id: str, offset: int, limit: int, sortmode: int) -> list[PlaylistTrack]:
        """Retrieve a sublist of tracks from the Playlists table"""
        logger.info(f"Retrieving Playlist tracks with offset {offset} and limit {limit} with sortmode {sortmode}")

        #see: apps/audio-server/api/routers/retrieval_router.py for mapping
        SORT_MAP = {
            0: "position ASC",
            1: "added_at DESC",
        }

        UNIT_SEP = "\x1f"
        RECORD_SEP = "\x1e"

        query = f'''
            WITH playlist_subset_tracks AS (
                -- Get track subset
                SELECT pt.track_internal_id, pt.position, pt.added_at
                FROM playlist_tracks pt
                JOIN playlists p ON p.internal_id = pt.playlist_internal_id
                WHERE p.id = :playlist_id
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
                
                s.added_at,
                s.position
            FROM playlist_subset_tracks s
            JOIN tracks t ON t.internal_id = s.track_internal_id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON ta.artist_internal_id = a.internal_id
            GROUP BY t.internal_id
            ORDER BY s.{SORT_MAP[sortmode]};
        '''

        try: 
            async with self.session() as db:
                params = {"playlist_id": playlist_id, "limit": limit, "offset": offset} #sql safety
                async with db.execute(query, params) as cursor:
                    rows = await cursor.fetchall()
                    return [
                        row_to_playlist_track(row) for row in rows
                    ]

        except Exception:
            logger.exception("Failed to retrieve Playlist contents")
            raise



    async def retrieve_track_details(self, track_id: str) -> TrackDetails:
        """Retrieve details about a track"""
        logger.info(f"Retrieving details about track_id: {track_id}")

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
                ) AS artist_blob,

                -- PlaylistBase fields
                GROUP_CONCAT(
                    p.internal_id || '{UNIT_SEP}' ||
                    COALESCE(p.id, '') || '{UNIT_SEP}' ||
                    p.name,
                    '{RECORD_SEP}'
                ) AS playlist_blob

            FROM tracks t

            -- Join artists
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON ta.artist_internal_id = a.internal_id

            -- Join playlists
            LEFT JOIN playlist_tracks pt ON pt.track_internal_id = t.internal_id
            LEFT JOIN playlists p ON pt.playlist_internal_id = p.internal_id

            WHERE t.id = ?

            GROUP BY t.internal_id

            LIMIT 1;
        '''

        try: 
            async with self.session() as db:
                async with db.execute(query, (track_id,)) as cursor:
                    row = await cursor.fetchone()
                    return row_to_track_details(row)
        except Exception:
            logger.exception("Failed to retrieve track details")
            raise
        

    async def retrieve_playlist_details(self, playlist_id: str) -> PlaylistDetails:
        """Retrieve details about a playlist"""
        logger.info(f"Retrieving details about playlist_id: {playlist_id}")

        query = f'''
            SELECT
                -- PlaylistBase fields
                p.internal_id,
                p.id,
                p.name,

                -- Metadata
                p.description
            FROM playlists p

            WHERE p.id = ?
            
            LIMIT 1;
        '''

        try: 
            async with self.session() as db:
                async with db.execute(query, (playlist_id,)) as cursor:
                    row = await cursor.fetchone()
                    return row_to_playlist_details(row)
        except Exception:
            logger.exception("Failed to retrieve playlist details")
            raise
        





