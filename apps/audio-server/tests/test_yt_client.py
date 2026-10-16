import pytest

from core.youtube.youtube_client import YouTubeClient


@pytest.mark.asyncio
async def test_search_by_query(yt: YouTubeClient):
    q1 = "rick astley never gonna give you up"
    o1 = await yt.search_by_query(q1, limit=1)
    assert len(o1) == 1


# @pytest.mark.asyncio
# async def test_search_by_id(yt: YouTubeClient):
#     q1 = "https://youtu.be/"