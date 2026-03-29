from pydantic import Field
from core.models.base import ScuttleBase

class TrackBase(ScuttleBase):
    id: str
    title: str
    title_display: str | None = None
    duration: float = 0.0

    artist_ids: list[str] = Field(..., min_length=1)

    @property
    def display(self) -> str:
        return self.title_display or self.title