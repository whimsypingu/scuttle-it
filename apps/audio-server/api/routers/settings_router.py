import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager, get_device_context, require_auth
from database.database_manager import DatabaseManager
from core.models.room import DeviceContext

SettingsRouter = APIRouter(prefix="/settings", tags=["Settings"], dependencies=[Depends(require_auth)])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@SettingsRouter.get("/get")
async def get_settings(
    ctx: DeviceContext = Depends(get_device_context),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        updated_settings = await db_manager.get_settings(ctx.room_id)
        return {
            "settings": updated_settings
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@SettingsRouter.post("/set-loopmode")
async def set_loopmode(
    ctx: DeviceContext = Depends(get_device_context),
    loopmode: int = Query(..., ge=0, le=2, description="0=None, 1=All, 2=One"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.set_loopmode(loopmode, ctx.room_id) #set the loopmode
        updated_settings = await db_manager.get_settings(ctx.room_id) #get the updated loopmode

        return {
            "settings": updated_settings
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


