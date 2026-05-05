import traceback

from core.models.playlist import CreatePlaylistPayload
from fastapi import APIRouter, Body, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

PlaylistRouter = APIRouter(prefix="/playlists", tags=["Playlists"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@PlaylistRouter.post("")
async def create_playlist_endpoint(
    payload: CreatePlaylistPayload = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.create_playlist(payload)

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    

@PlaylistRouter.delete("")
async def delete_playlist_endpoint(
    playlist_id: str = Query(..., min_length=1, description="Playlist ID for new playlist"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.delete_playlist(playlist_id)

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
        

@PlaylistRouter.get("")
async def get_playlists_endpoint(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try: 
        results = await db_manager.get_playlists()
        return {
            "success": True,
            "playlists": results
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    
