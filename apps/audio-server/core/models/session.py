from core.models.base import ScuttleBase


class DeviceContext(ScuttleBase):
    device_id: str
    session_id: str
