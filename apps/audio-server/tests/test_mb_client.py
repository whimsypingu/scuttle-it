import pytest

from core.models.track import TrackBase
from core.musicbrainz.musicbrainz_client import MusicBrainzClient


@pytest.mark.asyncio
async def test_track_match_record(mb: MusicBrainzClient, sample_track: TrackBase):

    print(sample_track.model_dump())

    o = await mb.match_record(sample_track)
    assert o is True

    print(sample_track.model_dump())