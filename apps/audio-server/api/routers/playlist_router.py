import traceback

from fastapi import APIRouter, Body, Depends, Path, HTTPException, Query
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

from core.models.payloads import CreatePlaylistPayload, EditPlaylistPayload

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
    

@PlaylistRouter.patch("/edit/{playlist_id}")
async def edit_playlist_endpoint(
    playlist_id: str = Path(..., min_length=1, description="Playlist ID"),
    payload: EditPlaylistPayload = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.edit_playlist(playlist_id, payload) #status after attempting push

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@PlaylistRouter.delete("/{playlist_id}")
async def delete_playlist_endpoint(
    playlist_id: str = Path(..., min_length=1, description="Playlist ID"),
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
    

@PlaylistRouter.post("/pin/set")
async def set_pin(
    playlist_id: str = Query(..., min_length=1, description="Playlist ID to set pin or unpin"),
    pinned: bool = Query(...),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        #explicitly choose the action to have toggle behavior
        if pinned:
            success = await db_manager.pin(playlist_id)
        else:
            success = await db_manager.unpin(playlist_id)

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@PlaylistRouter.get("/pinned")
async def get_pinned_playlists_endpoint(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        results = await db_manager.get_pinned_playlists()
        return {
            "success": True,
            "playlists": results,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
