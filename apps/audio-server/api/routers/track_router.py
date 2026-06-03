import traceback

from fastapi import APIRouter, Body, Depends, Path, HTTPException, Response, status
from api.dependencies import get_db_manager, get_stats_manager
from database.database_manager import DatabaseManager
from core.stats.stats_manager import StatsManager

from core.models.payloads import EditTrackPayload
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
        await db_manager.edit_track(track_id, payload) #status after attempting push

        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@TrackRouter.delete("/{track_id}")
async def delete_track_endpoint(
    track_id: str = Path(..., min_length=1, description="Track ID"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    stats_manager: StatsManager = Depends(get_stats_manager)
):
    try:
        success = await db_manager.unregister_download(track_id)

        #attempt deleting file, if it can't find the file or deleting the file fails for whatever reason
        #this whole operation is not necessarily a failure
        try:
            delete_track_file(track_id)
            stats_manager.flag_audio_storage() #recalculate audio storage next time
        except Exception as e:
            pass

        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
        