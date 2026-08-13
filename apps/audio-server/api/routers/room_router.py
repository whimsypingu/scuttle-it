import tempfile
import traceback
import subprocess
from pathlib import Path as FilePath

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status

from config import settings
from api.dependencies import get_db_manager, get_device_context, get_room_manager
from database.database_manager import DatabaseManager
from core.room.room_manager import RoomManager

from core.models.room import DeviceContext, Device
from core.models.responses import CreateJoinRoomResponse


RoomRouter = APIRouter(prefix="/room", tags=["Rooms"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@RoomRouter.post("/create", response_model=CreateJoinRoomResponse)
async def create_room_endpoint(
    device_ctx: DeviceContext = Depends(get_device_context),
    db_manager: DatabaseManager = Depends(get_db_manager),
    room_manager: RoomManager = Depends(get_room_manager)
):
    try:
        room_id = await db_manager.create_room()
        device: Device = room_manager.device_active(room_id, device_ctx.device_id)

        return {
            "room_id": room_id,
            "is_main": device.is_main
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

@RoomRouter.get("/join/{join_room_id}", response_model=CreateJoinRoomResponse)
async def join_room_endpoint(
    device_ctx: DeviceContext = Depends(get_device_context),
    join_room_id: str = Path(..., min_length=1, description="Join Room ID"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    room_manager: RoomManager = Depends(get_room_manager)
):
    try:
        is_valid = await db_manager.validate_room(join_room_id)

        if is_valid:
            device: Device = room_manager.device_active(join_room_id, device_ctx.device_id)

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
    url: str = Query(..., description="The URL or text to encode")
):
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False) #rather unfortunate that i did not implement stdout for the binary
    tmp_path = FilePath(tmp.name)
    tmp.close()

    try:
        target_image = settings.ASSETS_DIR / "qr_silhouette.png"
        cmd = [
            str(settings.QR_GEN_BIN_PATH),
            "-v", "9", #consider upping the version to a higher supported version for longer qr codes, but 7-L supports 154 chars anyway which is a lot
            "-l", "L",
            "-a", str(target_image),
            "-m", url,
            "-o", str(tmp_path)
        ]
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode != 0:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="QR generation failed")

        image_bytes = tmp_path.read_bytes()

    finally:
        if tmp_path.exists():
            tmp_path.unlink() #clean up tempfile

    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400, immutable"}
    )
