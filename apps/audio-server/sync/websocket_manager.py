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
        failed_connections = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                failed_connections.append(conn) #append and delete elsewhere to prevent Set changed size bugs witout running on a copy of the set
        
        for failed_conn in failed_connections:
                self.disconnect(failed_conn)

        logger.info(f"WebsocketManager broadcasting to {len(self.active_connections)} clients: {message}")
