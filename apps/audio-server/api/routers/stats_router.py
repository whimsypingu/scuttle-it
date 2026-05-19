import traceback

from fastapi import APIRouter, Body, Depends, Query, HTTPException
from api.dependencies import get_stats_manager
from core.stats.stats_manager import StatsManager

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
        print(payload)
        await stats_manager.increment_listen_duration(
            payload.track_id,
            payload.listen_duration
        )
        return {
            "success": True,
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException

