import pytest
from core.models.artist import ArtistBase
from core.models.track import TrackBase

@pytest.fixture
def sample_artist():
    return ArtistBase(
        id="artist_id_1",
        name="rick astley",
        name_display="Rick Astley"
    )

@pytest.fixture
def sample_track():
    return TrackBase(
        id="track_id_1",
        title="never gonna give you up",
        title_display="Never Gonna Give You Up",
        duration=212.0,
        artist_ids=["artist_id_1"]
    )