import pytest

from core.youtube.youtube_client import YouTubeClient


@pytest.mark.asyncio
async def test_search_link(yt: YouTubeClient):
    link1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    q1 = await yt.search_by_query(link1)
    print(q1)
    assert True

