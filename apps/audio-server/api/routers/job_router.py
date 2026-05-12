import traceback

from fastapi import APIRouter, Depends, HTTPException
from api.dependencies import get_dl_queue
from core.download.download_queue import DownloadQueue

JobRouter = APIRouter(prefix="/jobs", tags=["Jobs"])


@JobRouter.get("/search-and-download")
async def search_and_download_jobs_endpoint(
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        jobs = dl_queue.get_all_jobs()
        return {
            "success": True,
            "jobs": jobs
        }
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )

