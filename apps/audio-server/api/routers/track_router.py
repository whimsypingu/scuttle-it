import traceback

from fastapi import APIRouter, Body, Depends, Path, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

from core.models.track import EditTrackPayload
from core.audio.utils import delete_track_file

TrackRouter = APIRouter(prefix="/tracks", tags=["Tracks"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)
    

@TrackRouter.patch("/edit/{track_id}")
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


@TrackRouter.delete("/{track_id}")
async def delete_track_endpoint(
    track_id: str = Path(..., min_length=1, description="Track ID"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.unregister_track(track_id)

        #attempt deleting file, if it can't find the file or deleting the file fails for whatever reason
        #this whole operation is not necessarily a failure
        try:
            delete_track_file(track_id)
        except Exception as e:
            pass

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
        