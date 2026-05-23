from pydantic import Field
from core.models.base import ScuttleBase
from core.models.artist import ArtistBase
from core.models.playlist import PlaylistBase

class TrackBase(ScuttleBase):
    internal_id: int | None = None
    id: str | None = None #optional external source ID 
    title: str
    title_display: str | None = None
    duration: float = Field(default=0.0, ge=0.0, description="Duration in seconds")

    artists: list[ArtistBase] = Field(..., min_length=1)

    downloaded: bool | None = None

    @property
    def display(self) -> str:
        return self.title_display or self.title


class PlaylistTrack(TrackBase):
    added_at: int
    position: float


class QueueTrack(TrackBase):
    queue_id: int
    position: float


class TrackDetails(TrackBase):
    listened_duration: int
    listened_at: int
    playlists: list[PlaylistBase] = Field(default_factory=list)
    #include fields like last_played_at, or downloaded_at, etc.
