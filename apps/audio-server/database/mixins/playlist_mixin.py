import logging

from database.mixins.mixin_utils import row_to_summary_playlist

from core.models.playlist import SummaryPlaylist
from core.models.payloads import CreatePlaylistPayload, ReorderPlaylistPayload

logger = logging.getLogger(__name__)


class PlaylistMixin:
    """Handles custom user playlists"""

    async def create_playlist(self, payload: CreatePlaylistPayload) -> bool:
        """Creating a playlist"""
        logger.info(f"Creating playlist {payload.name} with playlist_id: {payload.playlist_id}...")

        try: 
            async with self.session() as db:
                await db.execute('''
                    INSERT INTO playlists (id, name, description)
                    VALUES (?, ?, ?);
                ''', (payload.playlist_id, payload.name, payload.description)) #raises exception if insertion fails due to colliding id

                logger.info(f"Successfully created playlist {payload.name} with playlist_id {payload.playlist_id}")
                return True

        except Exception:
            logger.exception(f"Failed to create playlist {payload.name} with playlist_id {payload.playlist_id}")
            raise


    async def delete_playlist(self, playlist_id: str) -> bool:
        """Delete a playlist"""
        logger.info(f"Deleting playlist_id: {playlist_id}...")

        try: 
            async with self.session() as db:
                await db.execute('''
                    DELETE FROM playlists
                    WHERE id = ?; 
                ''', (playlist_id,))

                logger.info(f"Successfully deleted playlist_id {playlist_id}")
                return True

        except Exception:
            logger.exception(f"Failed to delete playlist_id {playlist_id}")
            raise


    async def get_playlists(self) -> list[SummaryPlaylist]:
        """Retrieve the Playlists, with some extra metadata"""

        query = f'''
            SELECT
                -- PlaylistBase fields
                p.internal_id,
                p.id,
                p.name,

                -- Metadata
                COUNT(pt.track_internal_id) AS total_count,
                COALESCE(SUM(t.duration), 0) AS total_duration,
                p.description
            FROM playlists p
            LEFT JOIN playlist_tracks pt ON pt.playlist_internal_id = p.internal_id
            LEFT JOIN tracks t ON t.internal_id = pt.track_internal_id
            GROUP BY p.internal_id
            ORDER BY p.created_at DESC;
        '''

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    rows = await cursor.fetchall()

                    return [
                        row_to_summary_playlist(row) for row in rows
                    ]
        except Exception:
            logger.exception("Failed to retrieve Playlists")
            raise


    async def pin(self, playlist_id: str) -> bool:
        """Pin a playlist"""
        logger.info(f"Pinning playlist_id: {playlist_id}...")

        try: 
            async with self.session() as db:
                await db.execute('''
                    INSERT OR IGNORE INTO pins (playlist_internal_id, position)
                    SELECT internal_id, (SELECT COALESCE(MAX(position), 0) + 1.0 FROM pins)
                    FROM playlists
                    WHERE id = ?;
                ''', (playlist_id,))

                logger.info(f"Successfully pinned playlist_id {playlist_id}")
                return True

        except Exception:
            logger.exception(f"Failed to pin playlist_id {playlist_id}")
            raise


    async def unpin(self, playlist_id: str) -> bool:
        """Unpin a playlist"""
        logger.info(f"Unpinning playlist_id: {playlist_id}...")

        try: 
            async with self.session() as db:
                await db.execute('''
                    DELETE FROM pins
                    WHERE playlist_internal_id = (
                        SELECT internal_id FROM playlists WHERE id = ?
                    );
                ''', (playlist_id,))

                logger.info(f"Successfully unpinned playlist_id {playlist_id}")
                return True

        except Exception:
            logger.exception(f"Failed to unpin playlist_id {playlist_id}")
            raise


    async def get_pinned_playlists(self) -> list[SummaryPlaylist]:
        """Retrieve Pinned Playlists, with some extra metadata"""

        #only difference is inner join-ing on the pins table and custom ordering
        query = f'''
            SELECT
                -- PlaylistBase fields
                p.internal_id,
                p.id,
                p.name,

                -- Metadata
                COUNT(pt.track_internal_id) AS total_count,
                COALESCE(SUM(t.duration), 0) AS total_duration,
                p.description
            FROM playlists p
            JOIN pins x ON x.playlist_internal_id = p.internal_id
            LEFT JOIN playlist_tracks pt ON pt.playlist_internal_id = p.internal_id
            LEFT JOIN tracks t ON t.internal_id = pt.track_internal_id
            GROUP BY p.internal_id
            ORDER BY x.position ASC;
        '''

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    rows = await cursor.fetchall()

                    return [
                        row_to_summary_playlist(row) for row in rows
                    ]
        except Exception:
            logger.exception("Failed to retrieve Pinned Playlists")
            raise


    async def reorder_playlist(self, playlist_id: str, payload: ReorderPlaylistPayload) -> bool:
        """Reorder a track within the specified Playlist"""

        operator = ">=" if payload.below else "<="
        ordering = "ASC" if payload.below else "DESC"
        query = f'''
            SELECT t.id, pt.position
            FROM playlist_tracks pt
            JOIN playlists p ON p.internal_id = pt.playlist_internal_id
            JOIN tracks t ON t.internal_id = pt.track_internal_id
            WHERE p.id = ?
                AND pt.position {operator} (
                    SELECT inner_pt.position
                    FROM playlist_tracks inner_pt
                    JOIN tracks inner_t ON inner_t.internal_id = inner_pt.track_internal_id
                    WHERE inner_pt.playlist_internal_id = p.internal_id AND inner_t.id = ?
                )
            ORDER BY pt.position {ordering}
            LIMIT 2;
        '''

        try:
            async with self.session() as db:
                cursor = await db.execute(query, (playlist_id, payload.target_id))
                rows = await cursor.fetchall()

                logger.info(f"payload: {payload}")
                logger.info(f"row count: {len(rows)}, rows: {rows}")
                for row in rows:
                    logger.info(f"row: {row["id"]}, position: {row["position"]}")

                if not rows:
                    return False
                
                if payload.source_id in [row["id"] for row in rows]:
                    return False
                
                if len(rows) == 1:
                    if payload.below:
                        new_position = rows[0]["position"] + 100.0
                    else:
                        new_position = rows[0]["position"] - 100.0
                else:
                    new_position = (rows[0]["position"] + rows[1]["position"]) / 2.0

                logger.info(f"new_position: {new_position}")
                    
                await db.execute('''
                    UPDATE playlist_tracks
                    SET position = ?
                    WHERE playlist_internal_id = (SELECT internal_id FROM playlists WHERE id = ?)
                        AND track_internal_id = (SELECT internal_id FROM tracks WHERE id = ?);
                ''', (new_position, playlist_id, payload.source_id))
                return True
        except Exception:
            logger.exception("Failed to retrieve Pinned Playlists")
            raise



