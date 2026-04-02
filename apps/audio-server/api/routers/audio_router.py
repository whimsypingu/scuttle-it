import traceback
from pathlib import Path
from fastapi import APIRouter, Depends, Path, HTTPException
from fastapi.responses import FileResponse

from config import settings
from api.dependencies import get_db_manager, get_dl_queue
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.models.jobs import DownloadJob

AudioRouter = APIRouter(prefix="/audio", tags=["Audio"])


def resolve_track_path(track_id: str) -> Path:
    """Finds the first file matching track_id.* in the data directory."""
    for ext in [".flac", ".m4a", ".mp3"]: #EMERGENCY: remove this hardcoded value
        file_path = settings.DATA_DIR / f"{track_id}{ext}"
        if file_path.exists():
            return file_path
    raise HTTPException(status_code=404, detail=f"Track {track_id} not found")
    

@AudioRouter.get("/stream/{track_id}")
async def get_audio_stream(
    track_id: str = Path(..., min_length=1, description="Track ID"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        if not await db_manager.is_track_downloaded(track_id):
            job = DownloadJob(
                track_id=track_id,
                priority=True
            )
            await dl_queue.add(job)
            return {
                "job_id": job.id
            }
        
        file_path = resolve_track_path(track_id)

        return FileResponse(
            path=file_path,
            content_disposition_type="inline"
        )
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )