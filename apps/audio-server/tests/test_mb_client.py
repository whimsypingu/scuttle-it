import pytest

from core.models.track import TrackBase
from core.models.artist import ArtistBase
from core.musicbrainz.musicbrainz_client import MusicBrainzClient


@pytest.mark.asyncio
async def test_track_match_record(mb: MusicBrainzClient, sample_track: TrackBase):
    # print(sample_track.model_dump_json(indent=2))

    o = await mb.match_record(sample_track)
    assert o is True

    # print(sample_track.model_dump_json(indent=2))

    #custom example test
    t1 = TrackBase(
        id="track_id_2",
        title="speed of light",
        title_display="speed of",
        duration=100.0,
        artists=[ArtistBase(
            id="artist_id_2",
            name="kuala",
        )]
    )
    o1 = await mb.match_record(t1)
    assert o1 is True

    # print(t1.model_dump_json(indent=2))

    t2 = TrackBase(
        id="track_id_3",
        title="apt",
        title_display="",
        duration=100.0,
        artists=[
            ArtistBase(
                id="artist_id_3",
                name="bruno mars",
            ),
            #should populate with rose
        ]
    )
    o2 = await mb.match_record(t2)
    assert o2 is True

    # print(t2.model_dump_json(indent=2))


async def test_bad_track_match_record(mb: MusicBrainzClient):
    t1 = TrackBase(
        id="track_id_4",
        title="hurdygurdydurrr",
        duration=100.0,
        artists=[
            ArtistBase(
                id="artist_id_4",
                name="small chungus",
            ),
        ]
    )
    o1 = await mb.match_record(t1)
    assert o1 is False


async def test_post_adapter_track_match_record(mb: MusicBrainzClient):
    t1 = TrackBase(
        id="track_id_5", 
        title="See You Again",
        duration=100.0,
        artists=[
            ArtistBase(
                name="Tyler, The Creator"
            ),
            ArtistBase(
                name="Kali Uchis"
            )
        ]
    )
    o1 = await mb.match_record(t1)
    print(t1.model_dump_json(indent=2))
    print(o1)