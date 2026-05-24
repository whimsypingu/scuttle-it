from core.models.base import ScuttleBase
from core.models.track import QueueTrack, TrackBase


class RetrievalResponse(ScuttleBase):
    count: int
    total_count: int
    total_duration: int
    offset: int
    limit: int
    results: list[TrackBase]

class StatsResponse(ScuttleBase):
    total_track_count: int
    total_listened_duration: int
    total_storage_used: int

class SetAllQueueResponse(ScuttleBase):
    set_count: int
    skip_count: int
    queue: list[QueueTrack]