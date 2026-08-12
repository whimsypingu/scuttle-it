import tempfile
import traceback
import subprocess
from pathlib import Path as FilePath

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status

from config import settings
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager
from core.models.responses import CreateRoomResponse


RoomRouter = APIRouter(prefix="/room", tags=["Rooms"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@RoomRouter.post("/create", response_model=CreateRoomResponse)
async def create_room_endpoint(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        room_id = await db_manager.create_room()
        return {
            "room_id": room_id
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

@RoomRouter.get("/join/{room_id}")
async def join_room_endpoint(
    room_id: str = Path(..., min_length=1, description="Room ID"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        is_valid = await db_manager.validate_room(room_id)

        if is_valid:
            return Response(status_code=status.HTTP_204_NO_CONTENT)
        
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
