import traceback

from fastapi import APIRouter, Body, Cookie, Depends, HTTPException, Response, status

from config import settings

from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager
from core.models.payloads import LoginPayload
from core.models.responses import AuthResponse, LoginResponse


AuthRouter = APIRouter(prefix="/auth", tags=["Authentication"])


@AuthRouter.post("/login")
async def login(
    response: Response,
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

        #attach cookie
        auth_token = await db_manager.create_cookie_token(settings.TTL_AUTH_TOKEN)

        response.set_cookie(
            key="auth_token",
            value=auth_token,
            max_age=settings.TTL_AUTH_TOKEN,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/"
        )

        #result of login attempt
        return LoginResponse(
            success=True
        )

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )


@AuthRouter.get("/me")
async def get_auth_me(
    response: Response,
    auth_token: str | None = Cookie(None),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        if not auth_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No auth token provided"
            )

        isAuth = await db_manager.validate_refresh_cookie_token(auth_token, settings.TTL_AUTH_TOKEN)

        #remove cookie if not authorized
        if not isAuth:
            response.delete_cookie("auth_token", path="/")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Auth token expired"
            )

        response.set_cookie(
            key="auth_token",
            value=auth_token,
            max_age=settings.TTL_AUTH_TOKEN,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/"
        )

        return AuthResponse(
            success=True
        )

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )



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