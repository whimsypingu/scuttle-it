from core.models.base import ScuttleBase


class DeviceContext(ScuttleBase):
    device_id: str
    room_id: str
