import tempfile
import traceback

from asyncio import subprocess
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status

from config import settings
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager
from core.models.responses import CreateSessionResponse


SessionRouter = APIRouter(prefix="/session", tags=["Sessions"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@SessionRouter.post("/create", response_model=CreateSessionResponse)
async def create_session_endpoint(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        session_id = await db_manager.create_session()
        return {
            "session_id": session_id
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

@SessionRouter.get("/join/{session_id}")
async def join_session_endpoint(
    session_id: str = Path(..., min_length=1, description="Session ID"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        is_valid = await db_manager.validate_session(session_id)

        if is_valid:
            return Response(status_code=status.HTTP_204_NO_CONTENT)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session invalid or expired"
        )

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@SessionRouter.get("/qr.png")
async def generate_qr(
    url: str = Query(..., description="The URL or text to encode")
):
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        target_image = settings.ASSETS_DIR / "qr_silhouette.png"
        cmd = [
            str(settings.QR_GEN_BIN_PATH),
            "-v", "7",
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
            tmp_path.unlink()

    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public,immutable"}
    )
