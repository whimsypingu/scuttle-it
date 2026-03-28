from typing import Optional
from core.models.base import ScuttleBase

class ArtistBase(ScuttleBase):
    id: str
    artist: str
    artist_display: Optional[str] = None

    @property
    def display(self) -> str:
        return self.title_display or self.title