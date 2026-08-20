import logging
import hashlib
import hmac
import secrets

logger = logging.getLogger(__name__)


class AuthMixin:
    """Handles authorization methods"""

    async def validate_password(self, password: str) -> bool:
        """Login"""
        logger.info(f"Validating password...")

        try:
            async with self.session() as db:
                cursor = await db.execute("SELECT password_hash, password_salt FROM settings WHERE id = 1;")
                row = await cursor.fetchone()

                stored_hash, stored_salt = row[0], row[1] #these should be stored as strings representing hex values

                #empty case early return
                if not password and not stored_hash:
                    return True

                #guard against fromhex(None) and fallthrough after empty case, where a password is supplied but no salt value. salt and hash must be both None or values
                if not stored_salt:
                    return False

                salt_bytes = bytes.fromhex(stored_salt)
                computed_hash = hashlib.scrypt(
                    password.encode("utf-8"),
                    salt=salt_bytes,
                    n=16384,
                    r=8, #https://datatracker.ietf.org/doc/html/rfc7914.html#page-3
                    p=1
                ).hex()

                return hmac.compare_digest(computed_hash, stored_hash) #constant time comparison

        except Exception as e:
            logger.error(f"Password validation error: {e}")
            return False

    async def create_cookie_token(self, ttl_seconds: int = 432000) -> str:
        """Generates a cryptographically secure cookie token and stores the SHA-256 hash in the auth table"""

        token = secrets.token_urlsafe(32) #alphanumeric token
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest() #hash quickly and store the hex value

        try:
            async with self.session() as db:
                await db.execute('''
                    INSERT INTO auth (token_hash, refreshed_at, expires_at)
                    VALUES (?, unixepoch(), unixepoch() + ?);
                ''', (token_hash, ttl_seconds))

            return token

        except Exception:
            logger.exception(f"Failed to generate cookie token")
            raise
            



    # async def authenticate(self, token: str) -> bool:
    #     """Check that a token's hash exists in the database"""
    #     logger.info(f"Authenticating track_id: {track_id}...")

    #     try: 
    #         async with self.session() as db:
    #             await db.execute('''
    #                 INSERT OR IGNORE INTO likes (track_internal_id, position)
    #                 SELECT internal_id, (SELECT COALESCE(MAX(position), 0) + 1.0 FROM likes)
    #                 FROM tracks
    #                 WHERE id = ?;
    #             ''', (track_id,))

    #             logger.info(f"Successfully liked track_id {track_id}")
    #             return True

    #     except Exception:
    #         logger.exception(f"Failed to like track_id {track_id}")
    #         raise


    # async def unlike(self, track_id: str) -> bool:
    #     """Unlike a track"""
    #     logger.info(f"Unliking track_id: {track_id}...")

    #     try: 
    #         async with self.session() as db:
    #             await db.execute('''
    #                 DELETE FROM likes
    #                 WHERE track_internal_id = (
    #                     SELECT internal_id FROM tracks WHERE id = ?
    #                 );
    #             ''', (track_id,))

    #             logger.info(f"Successfully unliked track_id {track_id}")
    #             return True

    #     except Exception:
    #         logger.exception(f"Failed to unlike track_id {track_id}")
    #         raise

