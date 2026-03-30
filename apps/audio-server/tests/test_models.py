import pytest
from pydantic import ValidationError
from core.models.track import TrackBase


def test_artist_creation_success(sample_artist):
    assert sample_artist is not None


def test_artist_display_override(sample_artist):
    assert sample_artist.name_display is not None
    assert sample_artist.name_display != sample_artist.name
    assert sample_artist.name_display == sample_artist.display


def test_track_creation_success(sample_track):
    assert sample_track is not None


def test_track_display_override(sample_track):
    assert sample_track.title_display is not None
    assert sample_track.title_display != sample_track.title
    assert sample_track.title_display == sample_track.display


def test_track_requires_at_least_one_artist(missing_artists_track_data):
    #should fail when no artists are supplied for a track
    with pytest.raises(ValidationError):
        TrackBase(**missing_artists_track_data)


