import pytest

from core.link.link_adapter import LinkAdapter


def test_youtube_adapter_extract_track_id(la: LinkAdapter):
    # List of various URLs to test the routing logic -- https://gist.github.com/rodrigoborgesdeoliveira/987683cfbfcc8d800192da1e73adc486
    test_urls = [
        # Standard YouTube Desktop
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=shared", #rickroll
        # YouTube other
        "https://www.youtube.com/v/dQw4w9WgXcQ",
        # YouTube Mobile
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        # YouTube Shortener
        "https://youtu.be/dQw4w9WgXcQ?si=tracking_garbage",
        # YouTube Shorts layout
        "https://youtube.com/shorts/dQw4w9WgXcQ",
        # Missing scheme (http/https) check
        "youtu.be/dQw4w9WgXcQ",
    ]
    for url in test_urls:
        assert la.extract_id(url) == ("track", "dQw4w9WgXcQ")

def test_youtube_adapter_extract_playlist_id(la: LinkAdapter):
    u1 = "https://www.youtube.com/watch?v=jNQXAC9IVRw&list=PLbpi6ZahtOH75Gj-P-YZYV6hSY5SHQKeV&index=1" #first track in a playlist
    assert la.extract_id(u1) == ("track", "jNQXAC9IVRw")

    u2 = "https://www.youtube.com/playlist?list=PLbpi6ZahtOH75Gj-P-YZYV6hSY5SHQKeV" #20 years 20 breakthrough videos
    assert la.extract_id(u2) == ("playlist", "PLbpi6ZahtOH75Gj-P-YZYV6hSY5SHQKeV")

@pytest.mark.asyncio
async def test_youtube_adapter_expand_jobs(la: LinkAdapter):
    u1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=shared" #first track in a playlist, should be handled like just a track
    j1, p1 = await la.expand_jobs(u1)
    assert len(j1) == 1
    assert p1 is None #payload is None for no create playlist
    for job in j1:
        assert job.track_id == "dQw4w9WgXcQ"
        assert job.priority is True

    u2 = "https://www.youtube.com/playlist?list=PLbpi6ZahtOH75Gj-P-YZYV6hSY5SHQKeV" #20 years 20 breakthrough videos
    j2, p2 = await la.expand_jobs(u2)
    assert len(j2) == 20
    for job in j2:
        assert job.track_id is not None
        assert job.priority is False


def test_spotify_adapter_extract_track_id(la: LinkAdapter):
    url = "https://open.spotify.com/track/4PTG3Z6ehGkBFwjybzWkR8" #rickroll
    assert la.extract_id(url) == ("track", "4PTG3Z6ehGkBFwjybzWkR8")

def test_spotify_adapter_extract_playlist_id(la: LinkAdapter):
    url = "https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF" #daily top 50 global
    assert la.extract_id(url) == ("playlist", "37i9dQZEVXbMDoHDwVN2tF")

@pytest.mark.asyncio
async def test_spotify_adapter_expand_jobs(la: LinkAdapter):
    u1 = "https://open.spotify.com/track/4PTG3Z6ehGkBFwjybzWkR8" #rickroll
    j1, p1 = await la.expand_jobs(u1)
    assert len(j1) == 1 #single track
    assert p1 is None #payload is None for no create playlist
    for job in j1:
        assert job.query is not None
        assert job.priority is True

    u2 = "https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF" #daily top 50 global
    j2, p2 = await la.expand_jobs(u2)
    assert len(j2) == 50
    for job in j2:
        assert job.query is not None # each track becomes a valid query
        assert job.priority is False # each track gets pushed to the back of the play queue
