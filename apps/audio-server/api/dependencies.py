from fastapi import Request
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue

# Dependencies to get from the server lifespan as defined in /main.py

def get_db_manager(request: Request) -> DatabaseManager:
    return request.app.state.db_manager

def get_dl_queue(request: Request) -> DownloadQueue:
    return request.app.state.dl_queue