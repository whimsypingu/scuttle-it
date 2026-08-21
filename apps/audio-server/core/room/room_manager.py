import asyncio
import hashlib
import logging
import secrets
import time
from typing import Any

from core.models.room import Device, JoinTicket, Room
from database.database_manager import DatabaseManager
from fastapi import WebSocket

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

        #join tickets
        self.join_tickets: dict[str, JoinTicket] = {}

        #atomicity
        self.lock = asyncio.Lock()

        self.is_running = True


    def device_active(self, room_id: str, device_id: str) -> Device:
        """Given a room_id and device_id 'touch' the device to note it is active"""
        #change room mapping if necessary
        last_room_id = self.device_to_room.get(device_id)

        if last_room_id and last_room_id != room_id:
            old_room = self.rooms.get(last_room_id)

            if old_room:
                old_room.remove_device(device_id)

                #clean up old room in memory if empty
                if not old_room.devices:
                    del self.rooms[last_room_id]

        #create the room in mem if it doesnt exist yet
        if room_id not in self.rooms:
            self.rooms[room_id] = Room(id=room_id) #potentially require a validation check with db?

        #add/touch the device
        device = self.rooms[room_id].add_or_touch_device(device_id)
        self.device_to_room[device_id] = room_id #update lookup table

        return device


    def connect_websocket(self, room_id: str, device_id: str, websocket: WebSocket) -> Device:
        """Attaches WebSocket"""
        device = self.device_active(room_id, device_id)
        device.websocket = websocket

        logger.info(f"Device '{device_id}' bound WebSocket in room '{room_id}'.")

        return device

    def disconnect_websocket(self, room_id: str, device_id: str):
        """Detaches WebSocket"""
        room = self.rooms.get(room_id)
        if room and device_id in room.devices:
            device = room.devices[device_id]
            device.websocket = None

            logger.info(f"Device '{device_id}' detached WebSocket in room '{room_id}'.")


    async def broadcast_room(
        self, 
        room_id: str, 
        message: dict[str, Any], 
        exclude: list[str] | None = None
    ) -> None:
        """Sends a JSON message to active WebSockets in a room"""
        room = self.rooms.get(room_id)
        if not room:
            return

        exclude_device_ids = exclude or []
        failed_device_ids: list[str] = []

        for device_id, device in room.devices.items():
            #skip over nonexistent websockets
            if not device.websocket:
                continue

            #skip excluded device_ids
            if device_id in exclude_device_ids:
                continue

            try:
                await device.websocket.send_json(message)
            except Exception:
                failed_device_ids.append(device_id)

        #disconnect failed connections
        for failed_device_id in failed_device_ids:
            self.disconnect_websocket(room_id, failed_device_id)

        logger.info(f"RoomManager broadcasting to room {room_id}: {message}")


    async def broadcast_all(
        self, 
        message: dict[str, Any], 
        exclude: list[str] | None = None
    ) -> None:
        """Sends a JSON message to every active WebSocket across all rooms"""
        for room_id in self.rooms.keys():
            await self.broadcast_room(room_id, message, exclude)

        logger.info(f"RoomManager broadcasting to all clients: {message}")


    async def create_join_ticket(self, room_id: str) -> str:
        """Creates a join ticket. Accepts room_id and outputs ticket_id"""
        ticket_id = secrets.token_urlsafe(32)

        async with self.lock:
            self.join_tickets = {
                id: ticket for id, ticket in self.join_tickets.items()
                if not ticket.is_expired
            }

            ticket_id_hash = hashlib.sha256(ticket_id.encode("utf-8")).hexdigest() #hash quickly and store the hex value
            self.join_tickets[ticket_id_hash] = JoinTicket(
                room_id=room_id,
                created_at=int(time.time())
            )

        return ticket_id

    async def redeem_join_ticket(self, ticket_id: str) -> str:
        """Redeems a join ticket. Accepts ticket_id and outputs room_id"""
        async with self.lock:
            ticket_id_hash = hashlib.sha256(ticket_id.encode("utf-8")).hexdigest() #hash quickly and store the hex value
            ticket = self.join_tickets.pop(ticket_id_hash, None)

            if ticket is None or ticket.is_expired:
                return None

            return ticket.room_id
        

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

    async def cleanup_rooms(self):
        try:
            invalid_room_ids = await self.db_manager.cleanup_rooms()

            async with self.lock:
                #clear up rooms
                for room_id in invalid_room_ids:
                    removed_room = self.rooms.pop(room_id, None)

                    #clear up device mapping, removing devices mapped to this room
                    if removed_room:
                        for device_id in removed_room.devices.keys():
                            self.device_to_room.pop(device_id, None)

            logger.info(f"Cleaned up {len(invalid_room_ids)} stale rooms.")

        except Exception as e:
            logger.error(f"Error: {str(e)}")

    async def run(self):
        """Main loop for running the RoomManager instance and periodically handling flush and cleanup every flush_interval seconds"""
        logger.info(f"RoomManager started.")

        try:
            while self.is_running:
                await asyncio.sleep(self.flush_interval)
                await self.flush()
                await self.cleanup_rooms()
        except asyncio.CancelledError:
            await self.flush()

    def stop(self):
        self.is_running = False
