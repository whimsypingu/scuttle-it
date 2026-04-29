import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

LikeRouter = APIRouter(prefix="/like", tags=["Like"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@LikeRouter.post("/set")
async def set_like(
    track_id: str = Query(..., min_length=1, description="Track ID to set first"),
    liked: bool = Query(...),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        #explicitly choose the action to have toggle behavior
        if liked:
            success = await db_manager.like(track_id)
        else:
            success = await db_manager.unlike(track_id)

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException