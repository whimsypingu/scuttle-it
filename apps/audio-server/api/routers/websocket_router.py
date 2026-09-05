import traceback

from database.database_manager import DatabaseManager
from fastapi import APIRouter, Cookie, Depends, Query, WebSocket, WebSocketDisconnect, status
from api.dependencies import get_db_manager, get_room_manager
from core.room.room_manager import RoomManager

WebsocketRouter = APIRouter(prefix="/websocket", tags=["Websocket"])

@WebsocketRouter.websocket("")
async def websocket_endpoint(
    ws: WebSocket,
    auth_token: str | None = Cookie(None),
    room_id: str = Query(..., min_length=1, max_length=4, alias="roomId"),
    device_id: str = Query(..., alias="deviceId"),
    room_manager: RoomManager = Depends(get_room_manager),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    WebSocket endpoint that registers a connection with the WebsocketManager
    and keeps it alive waiting for messages. Does not expect messages from client.
    """
    if not auth_token:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    is_auth = await db_manager.validate_cookie_token(auth_token)
    if not is_auth:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    #now that ws connection is validated
    await ws.accept()

    room_manager.connect_websocket(
        room_id=room_id,
        device_id=device_id,
        websocket=ws
    )

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        room_manager.disconnect_websocket(
            room_id=room_id,
            device_id=device_id
        )
