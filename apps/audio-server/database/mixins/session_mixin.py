import logging
import sqlite3

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
        
