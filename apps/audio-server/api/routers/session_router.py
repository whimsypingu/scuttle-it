import traceback

from fastapi import APIRouter, Depends, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

from core.models.responses import CreateSessionResponse


SessionRouter = APIRouter(prefix="/session", tags=["Sessions"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@SessionRouter.post("/create", response_model=CreateSessionResponse)
async def create_session_endpoint(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        session_id = await db_manager.create_session()
        return {
            "session_id": session_id
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

