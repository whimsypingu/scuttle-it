import logging

from database.mixins.mixin_utils import row_to_trackbase

from core.models.track import EditTrack, QueueTrack

logger = logging.getLogger(__name__)


class EditMixin:
    """Handles editing database records"""

    async def edit_track(self, edit: EditTrack) -> bool:
        """Edit track data"""
        if not edit.id:
            return False #EMERGENCY: throw an informative error
        
        logger.info(f"Editing track_id {edit.id}")

        try:
            async with self.session() as db:
                cursor = await db.execute("SELECT internal_id FROM tracks WHERE id = ?;", (edit.id,))
                row = await cursor.fetchone()
                if not row:
                    logger.error(f"Failed to get internal_id for track_id: {edit.id}")
                    raise ValueError("Failed to retrieve internal_id for edit_track")
                track_internal_id = row[0]

                #track field edits
                if edit.title_display:
                    await db.execute("UPDATE tracks SET title_display = ? WHERE id = ?;", (edit.title_display, edit.id))

                #flush and fill artists -- temp strategy, will require further logic in the future
                if edit.artists:
                    await db.execute("DELETE FROM track_artists WHERE track_internal_id = ?;", (track_internal_id,))

                    for artist in edit.artists:
                        cursor = await db.execute("INSERT INTO artists (name, name_display) VALUES (?, ?) RETURNING internal_id;", (artist.name_display, artist.name_display))
                        row = await cursor.fetchone()
                        if not row:
                            logger.error(f"Failed to get internal_id for edit_artist: {artist.name_display}")
                            raise ValueError("Failed to retrieve internal_id after insert edit_artist")
                        artist_internal_id = row[0]

                        #linking
                        await db.execute('''
                            INSERT INTO track_artists (track_internal_id, artist_internal_id)
                            VALUES (?, ?);
                        ''', (track_internal_id, artist_internal_id))

                #playlist junctions table
                if edit.playlist_ids:
                    cursor = await db.execute('''
                        SELECT
                            p.internal_id,
                            p.id,
                            COALESCE(MAX(pt.position), 0.0) AS last_position
                        FROM playlists p
                        LEFT JOIN playlist_tracks pt ON pt.playlist_internal_id = p.internal_id
                        GROUP BY p.internal_id;
                    ''')
                    rows = await cursor.fetchall()

                    #map of playlist information for later queries
                    playlist_info = {
                        row["id"]: {
                            "internal_id": row["internal_id"],
                            "position": row["last_position"] + 100.0
                        }
                        for row in rows
                    }

                    #collect existing memberships in db
                    cursor = await db.execute('''
                        SELECT p.id
                        FROM playlists p
                        JOIN playlist_tracks pt ON pt.playlist_internal_id = p.internal_id
                        JOIN tracks t ON t.internal_id = pt.track_internal_id
                        WHERE t.internal_id = ?;
                    ''', (track_internal_id,))
                    rows = await cursor.fetchall()

                    #set comparisons to find which playlists to add or remove memberships from
                    existing_set = {row["id"] for row in rows}
                    incoming_set = set(edit.playlist_ids)

                    to_add = incoming_set - existing_set
                    to_remove = existing_set - incoming_set

                    for playlist_id in to_add:
                        info = playlist_info[playlist_id]
                        await db.execute('''
                            INSERT INTO playlist_tracks (track_internal_id, playlist_internal_id, position)
                            VALUES (?, ?, ?);
                        ''', (track_internal_id, info["internal_id"], info["position"]))

                    for playlist_id in to_remove:
                        info = playlist_info[playlist_id]
                        await db.execute('''
                            DELETE FROM playlist_tracks
                            WHERE track_internal_id = ? AND playlist_internal_id = ?;
                        ''', (track_internal_id, info["internal_id"]))

                logger.info(f"Successfully edited track with original track_id: {edit.id} | {edit.title_display}")
                return True
        
        except Exception:
            logger.exception(f"Critical failure during track edit for original track_id: {edit.id}")
            raise
