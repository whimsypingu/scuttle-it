import asyncio
import logging

from database.database_manager import DatabaseManager

logger = logging.getLogger(__name__)


class RoomManager:
    def __init__(
        self,
        flush_interval: int,
        db_manager: DatabaseManager
    ):
        self.db_manager = db_manager

        self.flush_interval = flush_interval

        #running buffer mapping room_id -> last active time
        self.last_active_buffer: dict[str, int] = {}

        #atomicity
        self.lock = asyncio.Lock()

        self.is_running = True

    async def update_last_active(self, room_id: str, last_active: int):
        """Updates the listened at buffer with the most recent value"""
        async with self.lock:
            self.last_active_buffer[room_id] = max(
                self.last_active_buffer.get(room_id, last_active),
                last_active
            )

    async def flush(self):
        async with self.lock:
            if not self.last_active_buffer:
                return
            
            last_active_buffer_snapshot = self.last_active_buffer.copy()
            self.last_active_buffer.clear()

        try:
            await self.db_manager.update_last_active(last_active_buffer_snapshot)

            logger.info(f"Successfully flushed last active rooms into database")
        
        except Exception as e:
            logger.error(f"Error: {str(e)}")

    async def run(self):
        """Main loop for running the RoomManager instance and periodically handling flush and cleanup every flush_interval seconds"""
        logger.info(f"RoomManager started.")

        try:
            while self.is_running:
                await asyncio.sleep(self.flush_interval)
                await self.flush()
                await self.db_manager.cleanup_rooms()
        except asyncio.CancelledError:
            await self.flush()

    def stop(self):
        self.is_running = False
