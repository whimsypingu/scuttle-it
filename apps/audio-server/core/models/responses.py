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


class QueueResponse(ScuttleBase):
    queue: list[QueueTrack]
class SetFirstQueueResponse(QueueResponse):
    download_required: bool
class PushQueueResponse(QueueResponse):
    download_required: bool
class PushNextQueueResponse(QueueResponse):
    download_required: bool
class PopQueueResponse(QueueResponse):
    pass
class ShuffleQueueResponse(QueueResponse):
    pass
class SetAllQueueResponse(QueueResponse):
    set_count: int
    skip_count: int
