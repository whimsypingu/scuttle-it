import asyncio
import logging

from core.models.room import Device, DeviceContext, Room
from database.database_manager import DatabaseManager

logger = logging.getLogger(__name__)


class RoomManager:
    def __init__(
        self,
        flush_interval: int,
        db_manager: DatabaseManager
    ):
        self.db_manager = db_manager

        #in-memory mapping of room_id to Rooms
        self.rooms: dict[str, Room] = {}
        self.device_to_room: dict[str, str] = {}

        self.flush_interval = flush_interval

        #running buffer mapping room_id -> last active time
        self.last_active_buffer: dict[str, int] = {}

        #atomicity
        self.lock = asyncio.Lock()

        self.is_running = True


    def device_active(self, room_id: str, device_id: str):
        """Given a room_id and device_id 'touch' the device to note it is active"""
        #change room mapping if necessary
        last_room_id = self.device_to_room[device_id]
        if last_room_id != room_id:
            old_room = self.rooms.get(last_room_id)

            if old_room:
                old_room.remove_device(device_id)

                #clean up old room in memory if empty
                if not old_room.devices:
                    del self.rooms[last_room_id]

        #create the room in mem if it doesnt exist yet
        if room_id not in self.rooms:
            self.rooms[room_id] = Room(id=room_id)

        #add/touch the device
        self.rooms[room_id].add_or_touch_device(device_id)
        self.device_to_room[device_id] = room_id #update lookup table
        

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
