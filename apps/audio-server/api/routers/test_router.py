import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from routers.dependencies import get_yt_client, get_db_manager
from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager

router = APIRouter(prefix="/test", tags=["Test"])

@router.get("/ytdlp-version")
async def get_ytdlp_version(
    yt_client: YouTubeClient = Depends(get_yt_client)
):
    try:
        out, err = await yt_client._run_command(["yt-dlp", "--version"])
        return {"version": out}
    except Exception:
        return {"error": err}

@router.get("/yt-search")
async def search_yt(
    q: str = Query(..., min_length=1, description="The search term"),
    yt_client: YouTubeClient = Depends(get_yt_client)
):
    try:
        results = await yt_client.search_by_query(q)
        return {"results": results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )