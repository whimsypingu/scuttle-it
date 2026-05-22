import os
import asyncio
import logging

from database.database_manager import DatabaseManager
from sync.pokes import WSPokeFactory
from sync.websocket_manager import WebsocketManager

from config import settings

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
        self.listened_duration_buffer: dict[str, float] = {}
        
        self.listened_at_buffer: dict[str, int] = {}

        #atomic data alterations
        self.lock = asyncio.Lock()

        self.is_running = True

        #in-memory cache of the total audio storage
        self.audio_storage_cache = self.audio_storage(recalculate=True)
        self.AUDIO_EXTENSIONS = (
            '.MP3', '.WAV', '.FLAC', '.M4A', '.AAC', 
            '.OGG', '.OPUS', '.AIFF', '.ALAC', '.WMA'
        )

    async def increment_listened_duration(self, track_id: str, listened_duration: float):
        """Increments the listened duration buffer"""
        if not track_id or listened_duration <= 0:
            return
        
        async with self.lock:
            if track_id in self.listened_duration_buffer:
                self.listened_duration_buffer[track_id] += listened_duration
            else:
                self.listened_duration_buffer[track_id] = listened_duration

    async def updated_listened_at(self, track_id: str, listened_at: int):
        """Updates the listened at buffer with the most recent value"""
        async with self.lock:
            self.listened_at_buffer[track_id] = max(
                self.listened_at_buffer.get(track_id, listened_at),
                listened_at
            )
        
    async def flush(self):
        async with self.lock:
            if not self.listened_duration_buffer and not self.listened_at_buffer:
                return
            
            listened_duration_buffer_snapshot = self.listened_duration_buffer.copy() #shallow copy works because no mutable types inside
            self.listened_duration_buffer.clear()

            listened_at_buffer_snapshot = self.listened_at_buffer.copy()
            self.listened_at_buffer.clear()

        try:
            await self.db_manager.increment_listened_durations(listened_duration_buffer_snapshot)
            await self.db_manager.update_listened_ats(listened_at_buffer_snapshot)

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


    def audio_storage(self, recalculate: bool = False) -> int:
        if recalculate:
            total_audio_bytes = 0
            for root, _, files in os.walk(settings.DATA_DIR): #uses the settings data directory, may need configuration to support mounting folders
                for file in files:
                    if file.upper().endswith(self.AUDIO_EXTENSIONS):
                        file_path = os.path.join(root, file)
                        try:
                            total_audio_bytes += os.path.getsize(file_path)
                        except (OSError, FileNotFoundError):
                            continue
            self.audio_storage_cache = total_audio_bytes

        return self.audio_storage_cache #super fast
