import traceback

from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_db_manager
from database.database_manager import DatabaseManager

SettingsRouter = APIRouter(prefix="/settings", tags=["Settings"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@SettingsRouter.get("/get")
async def get_settings(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        updated_settings = await db_manager.get_settings()
        return {
            "success": True,
            "settings": updated_settings
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@SettingsRouter.post("/set-loopmode")
async def set_loopmode(
    loopmode: int = Query(..., ge=0, le=2, description="0=None, 1=All, 2=One"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        success = await db_manager.set_loopmode(loopmode) #set the loopmode
        updated_settings = await db_manager.get_settings() #get the updated loopmode

        return {
            "success": success,
            "settings": updated_settings
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


