import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_yt_client, get_db_manager
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

@router.post("/yt-search")
async def search_yt(
    q: str = Query(..., min_length=1, description="The search term"),
    limit: int = Query(default=5, ge=1, le=10),
    yt_client: YouTubeClient = Depends(get_yt_client),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
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
    
@router.post("/push-play-queue")
async def push_play_queue(
    track_id: str = Query(..., min_length=1, description="Track id to push"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        results = await db_manager.push_play_queue(track_id)
        return results
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    
@router.get("/get-play-queue")
async def get_play_queue(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try: 
        results = await db_manager.get_play_queue()
        return results
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    
