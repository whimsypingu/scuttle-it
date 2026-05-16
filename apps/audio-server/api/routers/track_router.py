import traceback

from fastapi import APIRouter, Body, Depends, Path, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

TrackRouter = APIRouter(prefix="/tracks", tags=["Tracks"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)
    

@TrackRouter.delete("/{track_id}")
async def delete_track_endpoint(
    track_id: str = Path(..., min_length=1, description="Track ID"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.unregister_track(track_id)

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
        