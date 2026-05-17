import traceback

from fastapi import APIRouter, Depends, Path, HTTPException
from fastapi.responses import FileResponse

from api.dependencies import get_db_manager, get_dl_queue
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.models.jobs import DownloadJob

from core.audio.utils import resolve_track_path

AudioRouter = APIRouter(prefix="/audio", tags=["Audio"])


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
        
        file_path = resolve_track_path(track_id) #raises FileNotFoundError on failure

        return FileResponse(
            path=file_path,
            content_disposition_type="inline"
        )
    
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, 
            detail=f"Track {track_id} not found"
        )
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )