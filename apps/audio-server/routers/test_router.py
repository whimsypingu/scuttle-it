from fastapi import APIRouter, Depends, HTTPException
from routers.dependencies import get_yt_client, get_db_manager
from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager

router = APIRouter(prefix="/test", tags=["Search"])

@router.get("/ytdlp-version")
async def get_ytdlp_version(
    yt_client: YouTubeClient = Depends(get_yt_client)
):
    try:
        out, err = await yt_client._run_command(["yt-dlp", "--version"])
        return {"version": out}
    except Exception:
        return {"error": err}
