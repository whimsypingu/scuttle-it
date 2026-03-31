import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_yt_client, get_db_manager
from core.youtube.youtube_client import YouTubeClient
from database.database_manager import DatabaseManager

QueueRouter = APIRouter(prefix="/queue", tags=["Queue"])


@QueueRouter.post("/push")
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
    
@QueueRouter.post("/pop")
async def pop_play_queue(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.pop_play_queue()
        return success
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    
@QueueRouter.get("/get")
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
    
