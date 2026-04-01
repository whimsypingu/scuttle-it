import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_dl_queue, get_db_manager
from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.models.jobs import DownloadJob


TestRouter = APIRouter(prefix="/test", tags=["Test"])

@TestRouter.get("/ytdlp-version")
async def get_ytdlp_version():
    try:
        yt_client = YouTubeClient()
        out, err = await yt_client._run_command(["yt-dlp", "--version"])
        return {"version": out}
    except Exception:
        return {"error": err}

@TestRouter.post("/yt-search")
async def search_yt(
    q: str = Query(..., min_length=1, description="The search term"),
    limit: int = Query(default=5, ge=1, le=10),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        yt_client = YouTubeClient()
        results = await yt_client.search_by_query(q, limit)

        for tb in results:
            await db_manager.register_track(tb)

        return {"results": results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    
@TestRouter.post("/download-by-search")
async def download_by_search(
    q: str = Query(..., min_length=1, description="Search query"),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        await dl_queue.add(DownloadJob(
            query=q
        ))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
        
@TestRouter.get("/db-search-proto")
async def db_search_proto(
    q: str = Query(..., min_length=1, description="Search query"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        result = await db_manager.test_search(q)
        return {
            "count": len(result),
            "result": result
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    