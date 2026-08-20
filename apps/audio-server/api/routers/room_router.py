import tempfile
import traceback
import subprocess
from pathlib import Path as FilePath

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request, Response, status

from config import settings
from api.dependencies import get_db_manager, get_device_context, get_room_manager, require_auth
from database.database_manager import DatabaseManager
from core.room.room_manager import RoomManager

from core.models.room import DeviceContext, Device
from core.models.responses import CreateJoinRoomResponse


RoomRouter = APIRouter(prefix="/room", tags=["Rooms"], dependencies=[Depends(require_auth)])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@RoomRouter.post("/create", response_model=CreateJoinRoomResponse)
async def create_room_endpoint(
    ctx: DeviceContext = Depends(get_device_context),
    db_manager: DatabaseManager = Depends(get_db_manager),
    room_manager: RoomManager = Depends(get_room_manager)
):
    try:
        room_id = await db_manager.create_room()
        device: Device = room_manager.device_active(room_id, ctx.device_id)

        return {
            "room_id": room_id,
            "is_main": device.is_main
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

@RoomRouter.get("/join/{join_room_id}", response_model=CreateJoinRoomResponse)
async def join_room_endpoint(
    ctx: DeviceContext = Depends(get_device_context),
    join_room_id: str = Path(..., min_length=1, description="Join Room ID"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    room_manager: RoomManager = Depends(get_room_manager)
):
    try:
        is_valid = await db_manager.validate_room(join_room_id)

        if is_valid:
            device: Device = room_manager.device_active(join_room_id, ctx.device_id)

            return {
                "room_id": join_room_id,
                "is_main": device.is_main
            }
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room invalid or expired"
        )

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@RoomRouter.get("/qr.png")
async def generate_qr(
    request: Request,
    room_id: str = Query(..., min_length=1, max_length=4, alias="roomId"),
    db_manager: DatabaseManager = Depends(get_db_manager),
):
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False) #rather unfortunate that i did not implement stdout for the binary
    tmp_path = FilePath(tmp.name)
    tmp.close()

    try:
        auth_token = await db_manager.create_cookie_token()

        #build the url, which will then redirect after completing auth
        base_url = str(request.base_url).rstrip("/")
        join_url = f"{base_url}/auth/j/{auth_token}?r={room_id}"
    
        target_image = settings.ASSETS_DIR / "qr_silhouette.png"
        cmd = [
            str(settings.QR_GEN_BIN_PATH),
            "-v", "9", #consider upping the version to a higher supported version for longer qr codes, but 7-L supports 154 chars anyway which is a lot
            "-l", "L",
            "-a", str(target_image),
            "-m", join_url,
            "-o", str(tmp_path)
        ]
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode != 0:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="QR generation failed")

        image_bytes = tmp_path.read_bytes()

    finally:
        if tmp_path.exists():
            tmp_path.unlink() #clean up tempfile

    #each scan gets a unique auth token so dont cache
    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"}
    )
