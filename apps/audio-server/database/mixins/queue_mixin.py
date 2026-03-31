import logging
import time

from core.models.artist import ArtistBase
from core.models.track import TrackBase

logger = logging.getLogger(__name__)


class PlayQueueMixin:
    """Handles database backed play queue"""

    async def push_play_queue(self, track_id) -> True:
        """Push to the end of the Play Queue"""
        logger.info(f"Pushing track_id {track_id} to the end of the Play Queue...")

        try:
            async with self.session() as db:
                cursor = await db.execute("SELECT COALESCE(MAX(position), 0.0) FROM play_queue;")
                row = await cursor.fetchone()
                current_max = row[0]

                new_position = current_max + 100.0
                
                #insert
                await db.execute('''
                    INSERT INTO play_queue (track_id, position)
                    VALUES (?, ?);
                ''', (track_id, new_position))

                logger.info(f"Successfully pushed track_id {track_id} to the end of the Play Queue with position value: {new_position}")
                return True
        
        except Exception:
            logger.exception(f"Failed to push track_id {track_id} to end of the Play Queue")
            raise


    async def get_play_queue(self) -> list[TrackBase]:
        """Retrieve the full play queue with all metadata"""

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

                -- Position
                pq.position
            FROM play_queue pq
            JOIN tracks t ON pq.track_id = t.id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON a.internal_id = ta.artist_internal_id
            GROUP BY pq.position
            ORDER BY pq.position ASC;
        '''

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    rows = await cursor.fetchall()

                    content = []
                    for row in rows:

                        #parse the artist blob back into ArtistBase objects
                        artists = []
                        for packet in row["artist_blob"].split(RECORD_SEP):
                            parts = packet.split(UNIT_SEP)

                            #explicit part handling
                            a_internal_id = int(parts[0])
                            a_id = parts[1] or None
                            a_name = parts[2]
                            a_name_display = parts[3] or None

                            artists.append(ArtistBase(
                                internal_id=a_internal_id,
                                id=a_id,
                                name=a_name,
                                name_display=a_name_display
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
            logger.exception("Failed to retrieve Play Queue contents")
            raise
