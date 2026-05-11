import logging

from database.mixins.mixin_utils import row_to_summary_playlist

from core.models.playlist import SummaryPlaylist, CreatePlaylistPayload

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
        """Retrieve the playlists, with some extra metadata"""

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
