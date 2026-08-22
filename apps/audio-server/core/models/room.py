import time

from pydantic import ConfigDict, Field
from fastapi import WebSocket

from core.models.base import ScuttleBase


class DeviceContext(ScuttleBase):
    device_id: str
    room_id: str


def _current_timestamp_int() -> int:
    return int(time.time())

class Device(ScuttleBase):
    id: str
    is_main: bool = False
    last_seen: int = Field(default_factory=_current_timestamp_int)
    websocket: WebSocket | None = Field(default=None, exclude=True) #remove from json

    model_config = ConfigDict(
        arbitrary_types_allowed=True
    )

    def touch(self) -> None:
        self.last_seen = _current_timestamp_int()

class Room(ScuttleBase):
    internal_id: int | None = None #not in use
    id: str
    devices: dict[str, Device] = Field(default_factory=dict)

    def add_or_touch_device(self, device_id: str) -> Device:
        #touchup
        if device_id in self.devices:
            device = self.devices[device_id]
            device.touch()
            return device

        #add
        device = Device(
            id=device_id,
            is_main=(len(self.devices) == 0)
        )
        self.devices[device_id] = device
        return device

    def remove_device(self, device_id: str) -> Device | None:
        removed = self.devices.pop(device_id, None)

        #assign is_main to the next available device within the room
        if removed and removed.is_main and self.devices:
            next_main = next(iter(self.devices.values()))
            next_main.is_main = True
        return removed

class JoinTicket(ScuttleBase):
    room_id: str
    created_at: int
    ttl: int = 60

    @property
    def is_expired(self) -> bool:
        return int(time.time()) > (self.created_at + self.ttl)