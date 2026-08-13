import time

from fastapi import Depends, Header, Request
from fastapi.requests import HTTPConnection

from config import settings
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.room.room_manager import RoomManager
from core.stats.stats_manager import StatsManager
from core.models.room import DeviceContext

from sync.pokes import WSPokeFactory


# Dependencies to get from the server lifespan as defined in /main.py
def get_db_manager(request: Request) -> DatabaseManager:
    return request.app.state.db_manager

def get_room_manager(connection: HTTPConnection) -> RoomManager:
    return connection.app.state.room_manager

def get_stats_manager(request: Request) -> StatsManager:
    return request.app.state.stats_manager

def get_dl_queue(request: Request) -> DownloadQueue:
    return request.app.state.dl_queue


# handles device context extraction
def get_device_context(
    device_id: str = Header("DEFAULT_DEVICE_ID", alias="Scuttle-Device-Id"),
    room_id: str = Header(settings.DEFAULT_ROOM_ID, alias="Scuttle-Room-Id")
) -> DeviceContext:
    return DeviceContext(
        device_id=device_id,
        room_id=room_id
    )


# updates room activity
async def set_room_active(
    ctx: DeviceContext = Depends(get_device_context),
    room_manager: RoomManager = Depends(get_room_manager)
):
    if ctx.room_id:
        last_active_ts = int(time.time())
        await room_manager.update_last_active(ctx.room_id, last_active_ts)

async def room_queue_update(
    ctx: DeviceContext = Depends(get_device_context),
    room_manager: RoomManager = Depends(get_room_manager)
):
    yield

    #run this after the endpoint finishes
    await room_manager.broadcast_room(
        ctx.room_id, 
        WSPokeFactory.queue_update()
    )
