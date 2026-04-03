from pydantic import Field
from core.models.base import ScuttleBase
from core.models.artist import ArtistBase

class TrackBase(ScuttleBase):
    internal_id: int | None = None
    id: str | None = None #optional external source ID 
    title: str
    title_display: str | None = None
    duration: float = Field(default=0.0, ge=0.0, description="Duration in seconds")

    artists: list[ArtistBase] = Field(..., min_length=1)

    @property
    def display(self) -> str:
        return self.title_display or self.title


class QueueTrack(TrackBase):
    queue_id: int