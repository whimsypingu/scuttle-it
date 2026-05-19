from fastapi import Request, WebSocket
from database.database_manager import DatabaseManager
from sync.websocket_manager import WebsocketManager
from core.download.download_queue import DownloadQueue
from core.stats.stats_manager import StatsManager

# Dependencies to get from the server lifespan as defined in /main.py

def get_db_manager(request: Request) -> DatabaseManager:
    return request.app.state.db_manager

def get_ws_manager(websocket: WebSocket) -> WebsocketManager:
    return websocket.app.state.ws_manager

def get_stats_manager(request: Request) -> StatsManager:
    return request.app.state.stats_manager

def get_dl_queue(request: Request) -> DownloadQueue:
    return request.app.state.dl_queue