import logging
import sqlite3

from core.models.track import TrackBase

logger = logging.getLogger(__name__)


class RegisterMixin:
    async def register_track(self, track: TrackBase) -> bool:
        """
        Register (insert) a track's metadata into the Tracks table. Returns True on success
        and False on failure due to duplicate pre-existing track id.

        This method ensures that the database always has up-to-date metadata for
        a given track. If the track already exists (based on its id), nothing happens;
        otherwise, a new row is inserted. The `downloads` and `playlist_titles`
        tables are not affected by this call - it only manages the metadata
        layer.

        Args:
            track (TrackBase): A TrackBase object
        """
        try:
            async with self.session() as db:
                #existence check
                async with db.execute('SELECT 1 FROM tracks WHERE id = ?', (track.id,)) as cursor:
                    if await cursor.fetchone():
                        logger.warning(f"Duplicate track with id {track.id} exists, skipping registration.")
                        return False
                    
                #insert
                cursor = await db.execute('''
                    INSERT INTO tracks (id, title, title_display, duration)
                    VALUES (?, ?, ?, ?)
                    RETURNING internal_id;
                ''', (track.id, track.title, track.title_display, track.duration))
                row = await cursor.fetchone()
                if not row:
                    logger.error(f"Failed to get internal_id for track: {track}")
                    raise ValueError("Failed to retrieve internal_id after insert track")
                track_internal_id = row[0]
                
                #insert artists
                for artist in track.artists:                
                    cursor = await db.execute('''
                        INSERT INTO artists (id, name, name_display)
                        VALUES (?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            name_display = COALESCE(excluded.name_display, artists.name_display)
                        RETURNING internal_id;
                    ''', (artist.id, artist.name, artist.name_display))
                    row = await cursor.fetchone()
                    if not row:
                        logger.error(f"Failed to get internal_id for artist: {artist}")
                        raise ValueError("Failed to retrieve internal_id after insert artist")
                    artist_internal_id = row[0]

                    #linking
                    await db.execute('''
                        INSERT INTO track_artists (track_internal_id, artist_internal_id)
                        VALUES (?, ?);
                    ''', (track_internal_id, artist_internal_id))

                logger.info(f"Successfully registered new track: {track.id} | {track.title}")
                return True
        
        except Exception:
            logger.exception(f"Critical failure during track registration for track: {track}")
            raise

    async def unregister_track(self, track_id: str) -> bool:
        """Completely remove metadata for a track_id, cascades to downloads, likes, etc. Returns True on success."""
        try:
            async with self.session() as db:
                await db.execute('DELETE FROM tracks WHERE id = ?;', (track_id,))
                logger.info(f"Unregistered track_id: {track_id}")
                return True
        
        except Exception:
            logger.exception(f"Critical failure during track un-registration for track_id: {track_id}")
            raise

    async def is_track_registered(self, track_id: str) -> bool:
        """Check if a track_id is registered to tracks. Returns True or False based on existence."""
        try: 
            async with self.session() as db:
                async with await db.execute('SELECT 1 FROM tracks WHERE id = ? LIMIT 1;', (track_id,)) as cursor:
                    row = await cursor.fetchone()
                    return row is not None
                
        except Exception:
            logger.exception(f"Critical failure during track registration check for track_id: {track_id}")
            raise

    async def register_download(self, track_id: str) -> bool:
        """Register a download. Returns True on success."""
        try:
            async with self.session() as db:
                await db.execute('''
                    INSERT OR IGNORE INTO downloads (track_internal_id, downloaded_at)
                    SELECT internal_id, unixepoch()
                    FROM tracks
                    WHERE id = ?;
                ''', (track_id,))
                logger.info(f"Registered download track_id: {track_id}")
                return True
        
        except sqlite3.IntegrityError:
            logger.error(f"Foreign Key Violation: Cannot register download without registered track for track_id: {track_id}")
            return False

        except Exception:
            logger.exception(f"Critical failure during track registration for track_id: {track_id}")
            raise

    async def unregister_download(self, track_id: str) -> bool:
        """Unregister a download. Returns True on success."""
        try:
            async with self.session() as db:
                await db.execute('''
                    DELETE FROM downloads 
                    WHERE track_internal_id = (SELECT internal_id FROM tracks WHERE id = ?);
                ''', (track_id,))
                logger.info(f"Unregistered download track_id: {track_id}")
                return True
        
        except Exception:
            logger.exception(f"Critical failure during download un-registration for track_id: {track_id}")
            raise

    async def is_track_downloaded(self, track_id: str) -> bool:
        """Check if a track_id is registered to downloaded. Returns True or False based on existence."""

        query = '''
            SELECT 1 FROM downloads d
            JOIN tracks t ON t.internal_id = d.track_internal_id
            WHERE t.id = ? LIMIT 1;
        '''

        try: 
            async with self.session() as db:
                async with await db.execute(query, (track_id,)) as cursor:
                    row = await cursor.fetchone()
                    return row is not None
                
        except Exception:
            logger.exception(f"Critical failure during download registration check for track_id: {track_id}")
            raise

