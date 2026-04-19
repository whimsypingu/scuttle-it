import traceback

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from api.dependencies import get_ws_manager
from sync.websocket_manager import WebsocketManager

router = APIRouter(prefix="/websocket")

@router.websocket("")
async def websocket_endpoint(
    ws: WebSocket,
    ws_manager: WebsocketManager = Depends(get_ws_manager)
):
    """
    WebSocket endpoint that registers a connection with the WebsocketManager
    and keeps it alive waiting for messages. Does not expect messages from client.
    """
    await ws.accept()

    ws_manager.connect(ws)
    try: 
        while True:
            # Just keep connection alive, do not expect messages from client
            await ws.receive()
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(ws) 

