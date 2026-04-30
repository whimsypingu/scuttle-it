import traceback
from typing import Literal

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

RetrievalRouter = APIRouter(prefix="/retrieve", tags=["Retrieval"])


@RetrievalRouter.get("/downloads")
async def retrieve_downloads(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=30),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        results = await db_manager.retrieve_downloads(offset, limit) #consider using asyncio.gather() for these read ops?
        total = await db_manager.count_downloads()
        return {
            "count": len(results),
            "total": total,
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


@RetrievalRouter.get("/likes")
async def retrieve_likes(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=30),
    sort_by: Literal["position", "added_at"] = Query(default="position"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        results = await db_manager.retrieve_likes(offset, limit, sort_by) #consider using asyncio.gather() for these read ops?
        total = await db_manager.count_likes()
        return {
            "count": len(results),
            "total": total,
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
