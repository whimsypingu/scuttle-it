import logging
import aiosqlite
import math
from pathlib import Path
from contextlib import asynccontextmanager

from config import settings

from database.mixins.seed_mixin import SeedMixin
from database.mixins.maintenance_mixin import MaintenanceMixin
from database.mixins.register_mixin import RegisterMixin
from database.mixins.retrieval_mixin import RetrievalMixin
from database.mixins.search_mixin import SearchMixin
from database.mixins.settings_mixin import SettingsMixin
from database.mixins.playlist_mixin import PlaylistMixin
from database.mixins.queue_mixin import PlayQueueMixin
from database.mixins.edit_mixin import EditMixin
from database.mixins.like_mixin import LikeMixin


logger = logging.getLogger(__name__)


class DatabaseManager(
    SeedMixin, 
    MaintenanceMixin, 
    RegisterMixin, 
    RetrievalMixin, 
    SearchMixin, 
    SettingsMixin, 
    PlaylistMixin,
    PlayQueueMixin,
    EditMixin,
    LikeMixin
):
    def __init__(
        self,
        **overrides
    ):
        self.db_dir: Path = settings.DATABASE_DIR
        self.db_path: Path = settings.DATABASE_DIR / "scuttle.db"
        self.sql_dir: Path = settings.DATABASE_DIR / "sql"

        self.data_dir: Path = settings.DATA_DIR

        for key, value in overrides.items():
            if hasattr(self, key):
                setattr(self, key, value)
            else:
                logger.warning(f"DatabaseManager ignored unknown override: {key}")

        logger.info(f"DatabaseManager ready.")

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