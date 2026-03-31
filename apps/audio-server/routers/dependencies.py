from fastapi import Request
from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager

# Dependencies to get from the server lifespan as defined in /main.py

def get_yt_client(request: Request) -> YouTubeClient:
    return request.app.state.yt_client

def get_db_manager(request: Request) -> DatabaseManager:
    return request.app.state.db_manager