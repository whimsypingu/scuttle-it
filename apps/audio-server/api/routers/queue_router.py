import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

QueueRouter = APIRouter(prefix="/queue", tags=["Queue"])


@QueueRouter.post("/push")
async def push_play_queue(
    track_id: str = Query(..., min_length=1, description="Track ID to push"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.push_play_queue(track_id) #status after attempting push
        updated_queue = await db_manager.get_play_queue() #get the updated queue

        return {
            "success": success,
            "queue": updated_queue
        }
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    
@QueueRouter.post("/pop")
async def pop_play_queue(
    queue_id: int = Query(..., description="Unique instance ID of the queued track to pop"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.pop_play_queue(queue_id) #status after attempting pop
        updated_queue = await db_manager.get_play_queue() #get the updated queue

        return {
            "success": success,
            "queue": updated_queue
        }
    
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
        return {
            "success": True,
            "queue": results
        }
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    
