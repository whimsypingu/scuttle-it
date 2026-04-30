from core.models.base import ScuttleBase
from core.models.track import TrackBase


class RetrievalResponse(ScuttleBase):
    count: int
    total_count: int
    total_duration: int
    offset: int
    limit: int
    results: list[TrackBase]