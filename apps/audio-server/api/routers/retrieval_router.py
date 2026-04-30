import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

from core.models.responses import RetrievalResponse

RetrievalRouter = APIRouter(prefix="/retrieve", tags=["Retrieval"])


@RetrievalRouter.get("/downloads", response_model=RetrievalResponse)
async def retrieve_downloads(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=30),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        results = await db_manager.retrieve_downloads(offset, limit) #consider using asyncio.gather() for these read ops?
        stats = await db_manager.retrieve_downloads_stats()
        return {
            "count": len(results),
            "total_count": stats["total_count"],
            "total_duration": stats["total_duration"],
            "offset": offset,
            "limit": limit,
            "results": results
        }
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )


@RetrievalRouter.get("/likes", response_model=RetrievalResponse)
async def retrieve_likes(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=30), 
    sortmode: int = Query(default=0, ge=0, le=1, description="0=position, 1=added_at"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        results = await db_manager.retrieve_likes(offset, limit, sortmode) #consider using asyncio.gather() for these read ops?
        stats = await db_manager.retrieve_likes_stats()
        return {
            "count": len(results),
            "total_count": stats["total_count"],
            "total_duration": stats["total_duration"],
            "offset": offset,
            "limit": limit,
            "results": results
        }
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
