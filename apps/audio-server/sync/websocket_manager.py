import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


#handles all websockets, singleton
class WebsocketManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()

    def connect(self, websocket: WebSocket):
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections): #iterate on a copy to prevent Set changed size bugs, just in case
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

        logger.info(f"WebsocketManager broadcasting to {len(self.active_connections)} clients: {message}")
