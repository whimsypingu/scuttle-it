import pytest
import pytest_asyncio
from pathlib import Path

from core.models.artist import ArtistBase
from core.models.track import TrackBase
from database.database_manager import DatabaseManager

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
        artists=[sample_artist]
    )

@pytest.fixture
def missing_artists_track_data():
    return {
        "id": "123",
        "title": "456",
        "artists": []
    }

@pytest_asyncio.fixture
async def db():
    #use :memory: for testing so we dont overwrite any real db
    test_db_file_path = Path("test_database.db")

    manager = DatabaseManager(
        db_path=test_db_file_path
    )

    await manager.build_from_directory()

    yield manager

    if test_db_file_path.exists():
        test_db_file_path.unlink()
