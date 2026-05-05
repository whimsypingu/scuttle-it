from pydantic import Field
from core.models.base import ScuttleBase
from core.models.artist import ArtistBase, EditArtist
from core.models.playlist import PlaylistBase

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


class PlaylistTrack(TrackBase):
    added_at: int
    position: float


class QueueTrack(TrackBase):
    queue_id: int
    position: float


class TrackDetails(TrackBase):
    playlists: list[PlaylistBase] = Field(default_factory=list)
    #include fields like last_played_at, or downloaded_at, etc.




#incoming pydantic object
#see: apps/web-client/src/store/hooks/hooks.types.ts
class EditTrackPayload(ScuttleBase):
    #id: str | None = None #optional external source ID to identify which track to edit
    new_id: str | None = None
    title_display: str | None = None

    artists: list[EditArtist] | None = None

    playlist_ids: list[str] | None = None #list of playlist IDs, if changed