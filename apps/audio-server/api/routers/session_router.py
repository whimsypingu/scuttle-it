import traceback

from fastapi import APIRouter, Depends, HTTPException, Path, Response, status
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

@SessionRouter.get("/join/{session_id}")
async def join_session_endpoint(
    session_id: str = Path(..., min_length=1, description="Session ID"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        is_valid = await db_manager.validate_session(session_id)

        if is_valid:
            return Response(status_code=status.HTTP_204_NO_CONTENT)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session invalid or expired"
        )

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException