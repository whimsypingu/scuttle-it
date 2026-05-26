import pytest

from core.link.link_adapter import LinkAdapter


def test_youtube_link_extract_id(la: LinkAdapter):
    # List of various URLs to test the routing logic -- https://gist.github.com/rodrigoborgesdeoliveira/987683cfbfcc8d800192da1e73adc486
    test_urls = [
        # Standard YouTube Desktop
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=shared",
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
        assert la.extract_id(url) == "dQw4w9WgXcQ"

