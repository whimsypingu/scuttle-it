import logging
import sqlite3
import time

from database.mixins.mixin_utils import generate_room_id

logger = logging.getLogger(__name__)


class RoomMixin:
    """Handles room"""

    async def create_room(self) -> str:
        """Create a new room"""
        logger.info(f"Creating new room id...")

        max_retries = 3
        for _ in range(max_retries):
            room_id = generate_room_id()
            try: 
                async with self.session() as db:
                    await db.execute('''
                        INSERT INTO rooms (id)
                        VALUES (?);
                    ''', (room_id,))

                    logger.info(f"Successfully created room_id {room_id}")
                    return room_id

            except sqlite3.IntegrityError:
                continue # collision on room id unique constraint, try again

            except Exception:
                logger.exception(f"Failed to create room_id {room_id}")
                raise


    async def validate_room(self, room_id) -> bool:
        """Validate that the room exists"""
        logger.info(f"Validating room_id {room_id}...")

        try: 
            async with self.session() as db:
                cursor = await db.execute("SELECT 1 FROM rooms WHERE id = ? LIMIT 1;", (room_id,))
                row = await cursor.fetchone()
                exists = row is not None

                if exists:
                    logger.info(f"Validated room_id {room_id}")
                else:
                    logger.info(f"Failed to validate room_id {room_id}")

                return exists

        except Exception:
            logger.exception(f"Failed to validate room_id {room_id}")
            raise


    async def update_last_active(self, buffer: dict[str, int]):
        logger.info(f"Updating last_active for rooms")

        cases = []          # "WHEN id = :id_0 THEN :ts_0"
        params = {}         # id_X ts_X mapping
        placeholders = []   # ":id_0", ":id_1", etc
        room_ids = []    # "abc", "def", etc

        for i, (room_id, last_active) in enumerate(buffer.items()):
            cases.append(f"WHEN id = :id_{i} THEN :ts_{i}")
            params[f"id_{i}"] = room_id
            params[f"ts_{i}"] = last_active
            placeholders.append(f":id_{i}")
            room_ids.append(room_id)

        if not room_ids:
            return True
        
        cases_clause = " ".join(cases)
        placeholders_clause = ", ".join(placeholders) # ":id_0, :id_1, ..."

        query = f"""
            UPDATE rooms
            SET last_active = MAX(COALESCE(last_active, 0), CASE {cases_clause} ELSE 0 END)
            WHERE id in ({placeholders_clause});
        """

        try:
            async with self.session() as db:
                await db.execute(query, params)

                logger.info(f"Successfully updated last_active for rooms")
                return True
            
        except Exception:
            logger.exception("Failed to update last_active for rooms")


    async def cleanup_rooms(self) -> list[str]:
        """Clean up and remove all rooms that are expired"""
        logger.info(f"Cleaning up rooms...")

        cutoff_ts = int(time.time()) - self.ROOM_EXPIRE_TIME

        try:
            async with self.session() as db:
                cursor = await db.execute('''
                    DELETE FROM rooms
                    WHERE id != ? AND COALESCE(last_active, 0) < ?
                    RETURNING id;
                ''', (self.DEFAULT_ROOM_ID, cutoff_ts))

                rows = await cursor.fetchall()
                deleted_ids = [row[0] for row in rows]

                logger.info(f"Successfully cleaned up {len(deleted_ids)} expired rooms")
                return deleted_ids
            
        except Exception:
            logger.exception(f"Failed to clean up expired rooms")
            raise


    async def delete_room(self, room_id) -> bool:
        """Delete a room"""
        logger.info(f"Deleting room_id {room_id}...")

        try: 
            async with self.session() as db:
                await db.execute("DELETE FROM rooms WHERE id = ?;", (room_id,))

                logger.info(f"Deleted room_id {room_id}")
                return True

        except Exception:
            logger.exception(f"Failed to delete room_id {room_id}")
            raise
        
