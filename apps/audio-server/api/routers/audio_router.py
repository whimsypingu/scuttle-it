import traceback
import mimetypes
from pathlib import Path
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse

from config import settings
from api.dependencies import get_db_manager, get_dl_queue
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.models.jobs import DownloadJob

AudioRouter = APIRouter(prefix="/audio", tags=["Audio"])


def resolve_track_path(track_id: str) -> Path:
    """Finds the first file matching track_id.* in the data directory."""
    matches = list(settings.DATA_DIR.glob(f"{track_id}.*"))

    if not matches:
        raise HTTPException(status_code=404, detail=f"Track {track_id} not found")
    
    return matches[0]


@AudioRouter.get("/stream")
async def get_audio_stream(
    track_id: str,
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        if not await db_manager.is_track_downloaded(track_id):
            job = DownloadJob(
                track_id=track_id,
                priority=True
            )
            dl_queue.add(job)
            return {
                "job_id": job.id
            }
        
        file_path = resolve_track_path(track_id)
        content_type, _ = mimetypes.guess_type(file_path)

        return FileResponse(
            path=file_path,
            media_type=content_type or "audio/mpeg",
            filename=file_path.name
        )
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )