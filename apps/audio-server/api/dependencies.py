import time

from fastapi import Depends, Header, Request, WebSocket

from config import settings
from database.database_manager import DatabaseManager
from sync.websocket_manager import WebsocketManager
from core.download.download_queue import DownloadQueue
from core.session.session_manager import SessionManager
from core.stats.stats_manager import StatsManager
from core.models.session import DeviceContext

# Dependencies to get from the server lifespan as defined in /main.py

def get_db_manager(request: Request) -> DatabaseManager:
    return request.app.state.db_manager

def get_ws_manager(websocket: WebSocket) -> WebsocketManager:
    return websocket.app.state.ws_manager

def get_stats_manager(request: Request) -> StatsManager:
    return request.app.state.stats_manager

def get_dl_queue(request: Request) -> DownloadQueue:
    return request.app.state.dl_queue


# handles device context extraction

def get_device_context(
    device_id: str = Header("DEFAULT_DEVICE_ID", alias="Scuttle-Device-Id"),
    session_id: str = Header(settings.DEFAULT_SESSION_ID, alias="Scuttle-Session-Id")
) -> DeviceContext:
    return DeviceContext(
        device_id=device_id,
        session_id=session_id
    )


# updates session activity

async def set_session_active(
    request: Request,
    ctx: DeviceContext = Depends(get_device_context)
):
    session_manager: SessionManager = request.app.state.session_manager
    last_active_ts = int(time.time())

    if ctx.session_id:
        await session_manager.update_last_active(ctx.session_id, last_active_ts)

