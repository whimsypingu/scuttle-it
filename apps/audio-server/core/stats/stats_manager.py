import asyncio
import logging

from database.database_manager import DatabaseManager
from sync.pokes import WSPokeFactory
from sync.websocket_manager import WebsocketManager

logger = logging.getLogger(__name__)


class StatsManager:
    def __init__(
        self,
        flush_interval: int,
        db_manager: DatabaseManager,
        ws_manager: WebsocketManager
    ):
        self.db_manager = db_manager
        self.ws_manager = ws_manager

        self.flush_interval = flush_interval

        #running buffer mapping track_id -> total floating point seconds accumulated listened -- db typecasts to int
        self.listen_duration_buffer: dict[str, float] = {}

        #atomic data alterations
        self.lock = asyncio.Lock()

        self.is_running = True

    async def increment_listen_duration(self, track_id: str, listen_duration: float):
        if not track_id or listen_duration <= 0:
            return
        
        async with self.lock:
            if track_id in self.listen_duration_buffer:
                self.listen_duration_buffer[track_id] += listen_duration
            else:
                self.listen_duration_buffer[track_id] = listen_duration
        
    async def flush(self):
        async with self.lock:
            if not self.listen_duration_buffer:
                return
            
            buffer_snapshot = self.listen_duration_buffer.copy() #shallow copy works because no mutable types inside
            self.listen_duration_buffer.clear()

        try:
            await self.db_manager.increment_listen_durations(buffer_snapshot)

            logger.info(f"Successfully flushed stats into database")
        
        except Exception as e:
            logger.error(f"Error: {str(e)}")

    async def run(self):
        """Main loop for running the StatsManager instance and periodically handling flush every flush_interval seconds"""
        logger.info(f"StatsManager started.")

        try:
            while self.is_running:
                await asyncio.sleep(self.flush_interval)
                await self.flush()
        except asyncio.CancelledError:
            await self.flush()

    def stop(self):
        self.is_running = False
