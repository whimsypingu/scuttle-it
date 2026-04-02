import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager, get_dl_queue
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.models.jobs import DownloadJob

SearchRouter = APIRouter(prefix="/search", tags=["Search"])


@SearchRouter.get("/db-search")
async def search_database(
    q: str = Query(..., min_length=1, description="Database search query"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        results = await db_manager.search(q)
        return {
            "count": len(results),
            "results": results
        }
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )


@SearchRouter.post("/yt-search")
async def search_youtube(
    q: str = Query(..., min_length=1, description="YouTube search query"),
    query_limit: int = Query(default=5, ge=1, le=10),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        job = DownloadJob(
            query=q,
            query_limit=query_limit
        )
        await dl_queue.add(job)
        return job.id
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )

