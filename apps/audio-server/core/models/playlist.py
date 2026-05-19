from pydantic import Field
from core.models.base import ScuttleBase

class PlaylistBase(ScuttleBase):
    internal_id: int | None = None
    id: str | None = None #optional public ID 
    name: str


class SummaryPlaylist(PlaylistBase):
    total_count: int = Field(default=0, ge=0, description="Number of tracks")
    total_duration: float = Field(default=0.0, ge=0.0, description="Duration in seconds")

    description: str | None = Field(None, description="Optional playlist description")


class PlaylistDetails(PlaylistBase):
    description: str | None = Field(None, description="")
    #include fields like created_at, etc.
