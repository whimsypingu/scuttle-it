from pydantic import BaseModel
from core.models.base import ScuttleBase

class ArtistBase(ScuttleBase):
    internal_id: int | None = None
    id: str | None = None #optional external source ID
    name: str
    name_display: str | None = None

    @property
    def display(self) -> str:
        return self.name_display or self.name
    
class EditArtist(BaseModel):
    id: str | None = None
    name_display: str | None = None