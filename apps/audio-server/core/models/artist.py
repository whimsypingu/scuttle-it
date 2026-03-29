from core.models.base import ScuttleBase

class ArtistBase(ScuttleBase):
    id: str
    name: str
    name_display: str | None = None

    @property
    def display(self) -> str:
        return self.name_display or self.name