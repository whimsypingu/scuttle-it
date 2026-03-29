from typing import Optional
from core.models.base import ScuttleBase

class ArtistBase(ScuttleBase):
    id: str
    name: str
    name_display: Optional[str] = None

    @property
    def display(self) -> str:
        return self.name_display or self.name