import traceback

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

from core.models.track import EditTrackPayload

EditRouter = APIRouter(prefix="/edit", tags=["Edit"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@EditRouter.patch("/track/{track_id}")
async def edit_track_endpoint(
    track_id: str = Path(..., min_length=1, description="Track ID"),
    payload: EditTrackPayload = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.edit_track(track_id, payload) #status after attempting push

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

