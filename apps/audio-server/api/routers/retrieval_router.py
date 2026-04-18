import traceback

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
            "results": results
        }
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )

