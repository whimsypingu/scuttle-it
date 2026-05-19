from core.models.base import ScuttleBase

#incoming pydantic objects

class IncrementListenDurationPayload(ScuttleBase):
    track_id: str
    listen_duration: float
