import traceback

from fastapi import APIRouter, Body, Depends, HTTPException, status

from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager
from core.models.payloads import LoginPayload
from core.models.responses import LoginResponse


AuthRouter = APIRouter(prefix="/auth", tags=["Authentication"])


@AuthRouter.post("/login")
async def login(
    payload: LoginPayload = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager),
):
    try: 
        is_valid = await db_manager.validate_password(payload.password)

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )

        return LoginResponse(
            success=True
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )

        #create and send cookie with token




# @AudioRouter.get("/stream/{track_id}")
# async def get_audio_stream(
#     ctx: DeviceContext = Depends(get_device_context),
#     room_id: str | None = Query(None, description="Room ID"),
#     track_id: str = Path(..., min_length=1, description="Track ID"),
#     db_manager: DatabaseManager = Depends(get_db_manager),
#     dl_queue: DownloadQueue = Depends(get_dl_queue)
# ):
#     try:
#         if not await db_manager.is_track_downloaded(track_id):
#             active_room_id = room_id or ctx.room_id #prefer raw room_id embedded into url, for src= requests, otherwise fallback
#             job = DownloadJob(
#                 track_id=track_id,
#                 priority=True,
#                 room_id=active_room_id
#             )
#             await dl_queue.add(job)
#             return {
#                 "job_id": job.id
#             }
        
#         file_path = resolve_track_path(track_id) #raises FileNotFoundError on failure

#         return FileResponse(
#             path=file_path,
#             content_disposition_type="inline"
#         )
    
#     except FileNotFoundError:
#         raise HTTPException(
#             status_code=404, 
#             detail=f"Track {track_id} not found"
#         )
    
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(
#             status_code=500,
#             detail="Crashed"
#         )