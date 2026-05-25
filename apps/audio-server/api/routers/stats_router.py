import traceback

from fastapi import APIRouter, Body, Depends, HTTPException
from api.dependencies import get_db_manager, get_stats_manager
from core.stats.stats_manager import StatsManager
from database.database_manager import DatabaseManager

from core.models.responses import StatsResponse
from core.models.payloads import IncrementListenDurationPayload

StatsRouter = APIRouter(prefix="/stats", tags=["Stats"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@StatsRouter.post("/increment/listen-duration")
async def increment_listen_duration(
    payload: IncrementListenDurationPayload = Body(...),
    stats_manager: StatsManager = Depends(get_stats_manager)
):
    try:
        await stats_manager.increment_listened_duration(
            payload.track_id,
            payload.listen_duration,
        )
        await stats_manager.updated_listened_at(
            payload.track_id,
            payload.timestamp,
        )
        return {
            "success": True,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@StatsRouter.get("/get", response_model=StatsResponse)
async def get_stats_endpoint(
    db_manager: DatabaseManager = Depends(get_db_manager),
    stats_manager: StatsManager = Depends(get_stats_manager),
):
    try:
        await stats_manager.flush()
        stats = await db_manager.get_stats() #total_track_count and total_listened_duration
        total_storage_used = stats_manager.audio_storage()
        return {
            **stats,
            "total_storage_used": total_storage_used
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
