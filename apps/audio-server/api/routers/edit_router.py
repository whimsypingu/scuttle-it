import traceback

from fastapi import APIRouter, Body, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

from core.models.track import EditTrack

EditRouter = APIRouter(prefix="/edit", tags=["Edit"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@EditRouter.post("/track")
async def edit_track_data(
    track_id: str = Query(..., min_length=1, description="Track ID to edit"),
    edit_track: EditTrack = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.edit_track(track_id, edit_track) #status after attempting push

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

