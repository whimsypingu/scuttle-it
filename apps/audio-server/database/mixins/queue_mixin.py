import logging
import random

from database.mixins.mixin_utils import row_to_trackbase

from core.models.track import QueueTrack
from core.models.payloads import ReorderQueuePayload

logger = logging.getLogger(__name__)


class PlayQueueMixin:
    """Handles database backed play queue"""

    async def set_first_play_queue(self, track_id) -> bool:
        """Set and replace the first element of the Play Queue"""
        logger.info(f"Setting track_id {track_id} as the first entry in the Play Queue...")

        try: 
            async with self.session() as db:
                cursor = await db.execute('''
                    DELETE FROM play_queue
                    WHERE queue_id = (
                        SELECT queue_id
                        FROM play_queue
                        ORDER BY position
                        LIMIT 1
                    )
                    RETURNING position;
                ''')
                row = await cursor.fetchone() #returns None if empty
                first_position = row[0] if row is not None else self.NEW_POSITION_GAP

                #insert
                await db.execute('''
                    INSERT INTO play_queue (track_internal_id, position)
                    SELECT internal_id, ?
                    FROM tracks
                    WHERE id = ?;
                ''', (first_position, track_id))

                logger.info(f"Successfully set track_id {track_id} as the first entry of the Play Queue with position value: {first_position}")
                return True

        except Exception:
            logger.exception(f"Failed to set track_id {track_id} as the first entry of the Play Queue")
            raise


    async def reorder_queue(self, payload: ReorderQueuePayload) -> bool:
        """
        Intelligent self-healing reordering with three-zone logic:
        1. < min: Min - self.NEW_POSITION_GAP
        2. >= max: Max + self.NEW_POSITION_GAP
        3. between: midpoint of nearest previous and next position
        """
        """Universal reordering: moves track to a new position. can be used for a loop all move to end"""
        logger.info(f"Reordering track with queue_id {payload.source_queue_id} in the Play Queue")

        #trick to get the (up to) two tracks that surround the new position of the source track after reordering (includes source track)
        operator = ">=" if payload.below else "<="
        ordering = "ASC" if payload.below else "DESC"

        query = f'''
            SELECT
                pq.queue_id,
                pq.position
            FROM play_queue pq
            JOIN tracks t ON t.internal_id = pq.track_internal_id
            WHERE pq.position {operator} (
                SELECT position
                FROM play_queue
                WHERE queue_id = ?
            )
            ORDER BY pq.position {ordering}
            LIMIT 2;
        '''
        params = (payload.target_queue_id,)

        try:
            async with self.session() as db:
                cursor = await db.execute(query, params)
                rows = await cursor.fetchall()

                if not rows or len(rows) > 2: #handle edge case of nothing or too much getting found somehow
                    return False
                
                if payload.source_queue_id in [row["queue_id"] for row in rows]: #handle edge case where track is not being moved actually so don't do anything
                    return False
                
                #determine the new_position of the source track
                if len(rows) == 1: #edge case literally where the track gets shifted to an edge
                    if payload.below:
                        new_position = rows[0]["position"] + self.NEW_POSITION_GAP
                    else:
                        new_position = rows[0]["position"] - self.NEW_POSITION_GAP
                else:
                    new_position = (rows[0]["position"] + rows[1]["position"]) / 2.0

                await db.execute(f'''
                    UPDATE play_queue
                    SET position = ?
                    WHERE queue_id = ?;
                ''', (new_position, payload.source_queue_id))

                logger.info(f"Successfully reordered track with queue_id {payload.source_queue_id} to position {new_position} in Play Queue")
                return True
        
        except Exception:
            logger.exception(f"Failed to reorder track with queue_id {payload.source_queue_id} to position {new_position} in Play Queue")
            raise


    async def push_play_queue(self, track_id) -> bool:
        """Push to the end of the Play Queue"""
        logger.info(f"Pushing track_id {track_id} to the end of the Play Queue...")

        try:
            async with self.session() as db:
                cursor = await db.execute("SELECT COALESCE(MAX(position), 0.0) FROM play_queue;")
                row = await cursor.fetchone()
                current_max = row[0]

                new_position = current_max + self.NEW_POSITION_GAP
                
                #insert
                await db.execute('''
                    INSERT INTO play_queue (track_internal_id, position)
                    SELECT internal_id, ?
                    FROM tracks
                    WHERE id = ?;
                ''', (new_position, track_id))

                logger.info(f"Successfully pushed track_id {track_id} to the end of the Play Queue with position value: {new_position}")
                return True
        
        except Exception:
            logger.exception(f"Failed to push track_id {track_id} to end of the Play Queue")
            raise


    async def push_next_play_queue(self, track_id) -> bool:
        """Push to the second spot in the Play Queue"""
        logger.info(f"Pushing track_id {track_id} into the next position of the Play Queue...")

        try:
            async with self.session() as db:
                cursor = await db.execute('''
                    SELECT position
                    FROM play_queue
                    ORDER BY position ASC
                    LIMIT 2;
                ''')
                rows = await cursor.fetchall()

                if not rows:                                                                #empty queue, set to first
                    new_position = self.NEW_POSITION_GAP
                elif len(rows) == 1:                                                        #only one item, set to next
                    new_position = rows[0]["position"] + self.NEW_POSITION_GAP
                else:                                                                       #insert in second position
                    new_position = (rows[0]["position"] + rows[1]["position"]) / 2.0 
                
                #insert
                await db.execute('''
                    INSERT INTO play_queue (track_internal_id, position)
                    SELECT internal_id, ?
                    FROM tracks
                    WHERE id = ?;
                ''', (new_position, track_id))

                logger.info(f"Successfully pushed track_id {track_id} to the next position of the Play Queue with position value: {new_position}")
                return True
        
        except Exception:
            logger.exception(f"Failed to push track_id {track_id} to next position in the Play Queue")
            raise


    async def pop_play_queue(self, queue_id) -> bool:
        """Pop a specific item from the Play Queue"""
        logger.info(f"Popping track with queue_id {queue_id} the Play Queue...")

        try:
            async with self.session() as db:
                cursor = await db.execute("DELETE FROM play_queue WHERE queue_id = ?;", (queue_id,))
                if cursor.rowcount == 0:
                    logger.info(f"Track {queue_id} already gone or doesn't exist.")
                    return False
                    
                logger.info(f"Successfully popped {queue_id} from the Play Queue")
                return True

        except Exception:
            logger.exception(f"Failed to pop track {queue_id} from the Play Queue")
            raise


    async def set_all_play_queue(self, playlist_id, sortmode) -> tuple[int, list[str]]:
        """Setting a playlist with a sort order as the Play Queue, returns set_count and ids of tracks requiring downloads"""
        logger.info(f"Setting playlist with playlist_id {playlist_id} as the Play Queue...")

        #see: apps/audio-server/api/routers/retrieval_router.py for mapping
        #select only the track internal_id, id, and download status, to perform splitting later since we need the not-downloaded tracks
        match playlist_id:
            case "likes":
                SORT_CLAUSE_MAP = {
                    0: "ORDER BY l.position ASC",
                    1: "ORDER BY l.liked_at DESC",
                    2: "", #ignore sort and shuffle manually
                }
                query = f'''
                    SELECT
                        t.internal_id,
                        t.id,
                        CASE WHEN d.track_internal_id IS NOT NULL THEN 1 ELSE 0 END AS downloaded
                    FROM likes l
                    JOIN tracks t ON t.internal_id = l.track_internal_id
                    LEFT JOIN downloads d ON d.track_internal_id = t.internal_id
                    {SORT_CLAUSE_MAP[sortmode]};
                '''
                params = ()
            case _:
                SORT_CLAUSE_MAP = {
                    0: "ORDER BY pt.position ASC",
                    1: "ORDER BY pt.added_at DESC",
                    2: "", #ignore sort and shuffle manually
                }
                query = f'''
                    SELECT
                        t.internal_id,
                        t.id,
                        CASE WHEN d.track_internal_id IS NOT NULL THEN 1 ELSE 0 END AS downloaded
                    FROM playlist_tracks pt
                    JOIN playlists p ON p.internal_id = pt.playlist_internal_id
                    JOIN tracks t ON t.internal_id = pt.track_internal_id
                    LEFT JOIN downloads d ON d.track_internal_id = t.internal_id
                    WHERE p.id = ?
                    {SORT_CLAUSE_MAP[sortmode]};
                '''
                params = (playlist_id,)

        try:
            async with self.session() as db:
                cursor = await db.execute(query, params)
                rows = await cursor.fetchall()

                #filter and split between tracks ready to go (and should be in queue) vs ones that require download
                downloaded_rows = [row for row in rows if row["downloaded"]]
                skipped = [row["id"] for row in rows if not row["downloaded"]]

                #perform manual python based shuffling, random uses fisher yates natively and is O(n): https://softwareengineering.stackexchange.com/questions/215737/how-python-random-shuffle-works
                if sortmode == 2:
                    random.shuffle(downloaded_rows)
                    random.shuffle(skipped)

                #form the right data type to send to the queue
                to_queue = [
                    (row["internal_id"], (idx + 1) * self.NEW_POSITION_GAP) 
                    for idx, row in enumerate(downloaded_rows)
                ]
                if to_queue:
                    await db.execute("DELETE FROM play_queue;")
                    await db.executemany("INSERT INTO play_queue (track_internal_id, position) VALUES (?, ?);", to_queue)
                    
                logger.info(f"Successfully set playlist {playlist_id} as the Play Queue")
                return len(to_queue), skipped

        except Exception:
            logger.exception(f"Failed to set playlist {playlist_id} as the Play Queue")
            raise


    async def shuffle_play_queue(self) -> bool:
        """Shuffles all elements of the Play Queue except the first, if there is one"""
        logger.info(f"Shuffling the Play Queue...")

        try:
            async with self.session() as db:
                cursor = await db.execute('''
                    SELECT track_internal_id, position
                    FROM play_queue
                    ORDER BY position ASC;
                ''')
                rows = await cursor.fetchall()

                if len(rows) <= 1:
                    logger.info(f"Play Queue has 1 or fewer items, skipping shuffle")
                    return False
                
                current_track = rows[0]
                shuffle_tracks = list(rows[1:]) #get a split of remaining queue tracks to shuffle

                random.shuffle(shuffle_tracks)

                #assign new positions to remainder of queue
                to_queue = [
                    (track["track_internal_id"], current_track["position"] + ((idx + 1) * self.NEW_POSITION_GAP))
                    for idx, track in enumerate(shuffle_tracks)
                ]

                await db.execute("DELETE FROM play_queue WHERE position > ?;", (current_track["position"],))
                await db.executemany("INSERT INTO play_queue (track_internal_id, position) VALUES (?, ?);", to_queue)

                logger.info(f"Successfully shuffled {len(shuffle_tracks)} tracks.")
                return True
            
        except Exception:
            logger.exception(f"Failed to shuffle Play Queue")
            raise

    
    async def clear_play_queue(self) -> bool:
        """Clears all elements of the Play Queue except the first, if there is one"""
        logger.info(f"Clearing the Play Queue...")

        try:
            async with self.session() as db:
                await db.execute('''
                    DELETE FROM play_queue
                    WHERE queue_id NOT IN (
                        SELECT queue_id FROM play_queue
                        ORDER BY position ASC
                        LIMIT 1
                    );
                ''')

                logger.info("Successfully cleared the Play Queue")
                return True
        
        except Exception:
            logger.exception(f"Failed to clear the Play Queue")
            raise


    async def get_play_queue(self) -> list[QueueTrack]:
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
                1 AS downloaded,

                -- ArtistBase fields
                GROUP_CONCAT(
                    a.internal_id || '{UNIT_SEP}' ||
                    COALESCE(a.id, '') || '{UNIT_SEP}' ||
                    a.name || '{UNIT_SEP}' ||
                    COALESCE(a.name_display, ''), 
                    '{RECORD_SEP}'
                ) AS artist_blob,

                -- Position
                pq.queue_id,
                pq.position
            FROM play_queue pq
            JOIN tracks t ON pq.track_internal_id = t.internal_id
            JOIN track_artists ta ON ta.track_internal_id = t.internal_id
            JOIN artists a ON a.internal_id = ta.artist_internal_id
            GROUP BY pq.position
            ORDER BY pq.position ASC;
        '''

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    rows = await cursor.fetchall()

                    return [
                        QueueTrack(
                            **row_to_trackbase(row).model_dump(),
                            queue_id=row["queue_id"],
                            position=row["position"]
                        ) for row in rows
                    ]

        except Exception:
            logger.exception("Failed to retrieve Play Queue contents")
            raise
