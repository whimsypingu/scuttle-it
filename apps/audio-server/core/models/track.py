from typing import Optional, List
from core.models.base import ScuttleBase

class TrackBase(ScuttleBase):
    id: str
    title: str
    title_display: Optional[str] = None
    duration: float = 0.0

    artist_ids: List[str] = []

    @property
    def display(self) -> str:
        return self.title_display or self.title