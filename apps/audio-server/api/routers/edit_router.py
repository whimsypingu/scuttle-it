import traceback

from fastapi import APIRouter, Body, Depends, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

from core.models.track import EditTrackPayload

EditRouter = APIRouter(prefix="/edit", tags=["Edit"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@EditRouter.post("/track")
async def edit_track_endpoint(
    payload: EditTrackPayload = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        if not payload.id: #require track id
            raise DefaultCrashException
        
        success = await db_manager.edit_track(payload) #status after attempting push

        return {
            "success": success,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

