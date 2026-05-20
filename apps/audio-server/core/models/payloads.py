from pydantic import Field
from core.models.base import ScuttleBase

#incoming pydantic objects

class IncrementListenDurationPayload(ScuttleBase):
    track_id: str
    timestamp: int
    listen_duration: float


#see: apps/web-client/src/store/hooks/hooks.types.ts
class EditArtistPayload(ScuttleBase):
    id: str | None = None #optional external source ID to identify which artist to edit
    new_id: str | None = None
    name_display: str | None = None
    
#see: apps/web-client/src/store/hooks/hooks.types.ts
class EditTrackPayload(ScuttleBase):
    id: str | None = None #optional external source ID to identify which artist to edit
    new_id: str | None = None
    title_display: str | None = None
    duration: float | None = None

    artists: list[EditArtistPayload] | None = None

    playlist_ids: list[str] | None = None #list of playlist IDs, if changed

#see: apps/web-client/src/store/hooks/hooks.types.ts
class CreatePlaylistPayload(ScuttleBase):
    playlist_id: str = Field(..., min_length=1) #frontend generated ID (custom UUID)
    name: str = Field(..., min_length=1, max_length=100)

    description: str | None = None

class EditPlaylistPayload(ScuttleBase):
    id: str | None = None #optional external source ID to identify which artist to edit
    name: str | None = None
    description: str | None = None
