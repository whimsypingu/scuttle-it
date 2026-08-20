import logging
import hashlib
import hmac
import secrets

from config import settings

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

    async def create_cookie_token(self, ttl_seconds: int = settings.TTL_AUTH_TOKEN) -> str:
        """Generates a cryptographically secure cookie token and stores the SHA-256 hash in the auth table"""
        logger.info(f"Creating new authentication token...")

        token = secrets.token_urlsafe(32) #alphanumeric token
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest() #hash quickly and store the hex value

        try:
            async with self.session() as db:
                #greedy kill stale tokens
                await db.execute("DELETE FROM auth WHERE expires_at <= unixepoch();")

                #insert new value
                await db.execute('''
                    INSERT INTO auth (token_hash, expires_at)
                    VALUES (?, unixepoch() + ?);
                ''', (token_hash, ttl_seconds))

            return token

        except Exception:
            logger.exception(f"Failed to generate cookie token")
            raise


    async def validate_cookie_token(self, token: str) -> bool:
        """Validates a cookie token"""

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest() #hash quickly and store the hex value

        try:
            async with self.session() as db:
                cursor = await db.execute('''
                    SELECT token_hash FROM auth
                    WHERE token_hash = ? AND expires_at > unixepoch();
                ''', (token_hash,))
                row = await cursor.fetchone()

                return row is not None

        except Exception:
            logger.exception(f"Failed to validate cookie token")
            raise
        


    async def validate_refresh_cookie_token(self, token: str, ttl_seconds: int = settings.TTL_AUTH_TOKEN) -> bool:
        """Validates and refreshes the cookie token expiration"""
        logger.info(f"Validating and refreshing authentication token...")

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest() #hash quickly and store the hex value

        try:
            async with self.session() as db:
                cursor = await db.execute('''
                    UPDATE auth
                    SET expires_at = unixepoch() + ?
                    WHERE token_hash = ? AND expires_at > unixepoch();
                ''', (ttl_seconds, token_hash,))

                #no rows changed then the token is missing or expired
                return cursor.rowcount != 0

        except Exception:
            logger.exception(f"Failed to validate and refresh cookie token")
            raise
