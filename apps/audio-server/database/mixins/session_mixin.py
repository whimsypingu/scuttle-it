import logging
import sqlite3
import time

from database.mixins.mixin_utils import generate_session_id

logger = logging.getLogger(__name__)


class SessionMixin:
    """Handles session"""

    async def create_session(self) -> str:
        """Create a new session"""
        logger.info(f"Creating new session id...")

        max_retries = 3
        for _ in range(max_retries):
            session_id = generate_session_id()
            try: 
                async with self.session() as db:
                    await db.execute('''
                        INSERT INTO sessions (id)
                        VALUES (?);
                    ''', (session_id,))

                    logger.info(f"Successfully created session_id {session_id}")
                    return session_id

            except sqlite3.IntegrityError:
                continue # collision on session id unique constraint, try again

            except Exception:
                logger.exception(f"Failed to create session_id {session_id}")
                raise


    async def validate_session(self, session_id) -> bool:
        """Validate that the session exists"""
        logger.info(f"Validating session_id {session_id}...")

        try: 
            async with self.session() as db:
                cursor = await db.execute("SELECT 1 FROM sessions WHERE id = ? LIMIT 1;", (session_id,))
                row = await cursor.fetchone()
                exists = row is not None

                if exists:
                    logger.info(f"Validated session_id {session_id}")
                else:
                    logger.info(f"Failed to validate session_id {session_id}")

                return exists

        except Exception:
            logger.exception(f"Failed to validate session_id {session_id}")
            raise


    async def update_last_active(self, buffer: dict[str, int]):
        logger.info(f"Updating last_active for sessions")

        cases = []          # "WHEN id = :id_0 THEN :ts_0"
        params = {}         # id_X ts_X mapping
        placeholders = []   # ":id_0", ":id_1", etc
        session_ids = []    # "abc", "def", etc

        for i, (session_id, last_active) in enumerate(buffer.items()):
            cases.append(f"WHEN id = :id_{i} THEN :ts_{i}")
            params[f"id_{i}"] = session_id
            params[f"ts_{i}"] = last_active
            placeholders.append(f":id_{i}")
            session_ids.append(session_id)

        if not session_ids:
            return True
        
        cases_clause = " ".join(cases)
        placeholders_clause = ", ".join(placeholders) # ":id_0, :id_1, ..."

        query = f"""
            UPDATE sessions
            SET last_active = MAX(COALESCE(last_active, 0), CASE {cases_clause} ELSE 0 END)
            WHERE id in ({placeholders_clause});
        """

        try:
            async with self.session() as db:
                await db.execute(query, params)

                logger.info(f"Successfully updated last_active for sessions")
                return True
            
        except Exception:
            logger.exception("Failed to update last_active for sessions")


    async def cleanup_sessions(self) -> bool:
        """Clean up and remove all sessions that are expired"""
        logger.info(f"Cleaning up sessions...")

        cutoff_ts = int(time.time()) - self.SESSION_EXPIRE_TIME

        try:
            async with self.session() as db:
                await db.execute('''
                    DELETE FROM sessions
                    WHERE id != ? AND COALESCE(last_active, 0) < ?;
                ''', (self.DEFAULT_SESSION_ID, cutoff_ts))

                logger.info(f"Successfully cleaned up expired sessions")
                return True
            
        except Exception:
            logger.exception(f"Failed to clean up expired sessions")
            raise


    async def delete_session(self, session_id) -> bool:
        """Delete a session"""
        logger.info(f"Deleting session_id {session_id}...")

        try: 
            async with self.session() as db:
                await db.execute("DELETE FROM sessions WHERE id = ?;", (session_id,))

                logger.info(f"Deleted session_id {session_id}")
                return True

        except Exception:
            logger.exception(f"Failed to delete session_id {session_id}")
            raise
        
