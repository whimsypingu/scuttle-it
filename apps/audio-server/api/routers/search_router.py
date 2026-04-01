import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

SearchRouter = APIRouter(prefix="/search", tags=["Search"])


@SearchRouter.post("/db-search")
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
