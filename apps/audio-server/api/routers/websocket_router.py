import traceback

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from api.dependencies import get_room_manager
from core.room.room_manager import RoomManager

WebsocketRouter = APIRouter(prefix="/websocket", tags=["Websocket"])

@WebsocketRouter.websocket("")
async def websocket_endpoint(
    ws: WebSocket,
    room_id: str = Query(..., min_length=1, max_length=4, alias="roomId"),
    device_id: str = Query(..., alias="deviceId"),
    room_manager: RoomManager = Depends(get_room_manager)
):
    """
    WebSocket endpoint that registers a connection with the WebsocketManager
    and keeps it alive waiting for messages. Does not expect messages from client.
    """
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
