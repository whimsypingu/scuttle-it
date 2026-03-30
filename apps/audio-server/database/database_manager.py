import logging
import aiosqlite
import math
from pathlib import Path
from contextlib import asynccontextmanager

from pydantic import BaseModel, DirectoryPath
from config import settings

from database.mixins.seed_mixin import SeedMixin


logger = logging.Logger(__name__)


class DatabaseManager(BaseModel, SeedMixin):
    db_dir: DirectoryPath = settings.DATABASE_DIR
    db_path: Path = settings.DATABASE_DIR / "scuttle.db" #not a pydantic FilePath because it may not exist on first run
    sql_dir: DirectoryPath = settings.DATABASE_DIR / "sql"

    data_dir: DirectoryPath = settings.DATA_DIR

    async def _get_connection(self) -> aiosqlite.Connection:
        """Returns an async connection with WAL and Scuttle UDFs"""
        conn = await aiosqlite.connect(self.db_path)
        conn.row_factory = aiosqlite.Row

        await conn.execute("PRAGMA journal_mode=WAL;")
        await conn.execute("PRAGMA foreign_keys=ON;")

        def sql_ln_boost(pref):
            return 1 + math.log(float(pref) + 1.0)
        
        await conn.create_function("LN_BOOST", 1, sql_ln_boost)
        return conn
    
    @asynccontextmanager
    async def session(self):
        """Managed async connection handling commits and rollbacks"""
        conn = await self._get_connection()
        try:
            yield conn
            await conn.commit()
        except Exception as e:
            await conn.rollback()
            logger.warning(f"Database action failed, rollback called: {e}")
            raise e
        finally:
            await conn.close()