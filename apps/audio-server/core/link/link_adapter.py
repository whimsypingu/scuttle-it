import logging
from urllib.parse import urlparse

from core.link.adapters.spotify_adapter import SpotifyAdapter
from core.link.adapters.youtube_adapter import YouTubeAdapter
from core.models.jobs import DownloadJob

logger = logging.getLogger(__name__)


class LinkAdapter():
    def __init__(
        self,
        **overrides
    ):        
        self._route_map: dict = {
            "youtube.com": YouTubeAdapter(),
            "m.youtube.com": YouTubeAdapter(),
            "youtu.be": YouTubeAdapter(),
            "spotify.com": SpotifyAdapter(),
        }

        for key, value in overrides.items():
            if hasattr(self, key):
                setattr(self, key, value)
            else:
                logger.warning(f"LinkAdapter ignored unknown override: {key}")

        logger.info(f"LinkAdapter ready.")

    def _get_adapter(self, url: str):
        """Parse the URL and find the registered adapter"""
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower().replace("www.", "")

            adapter = self._route_map.get(domain)
            return adapter, parsed_url
        except Exception:
            logger.warning(f"Adapter not found for extract_id on {url}")
            return None, None
        
    
    #public methods are safe and sort of compact this way    
    def extract_id(self, url: str) -> str | None:
        adapter, parsed_url = self._get_adapter(url)

        if adapter and hasattr(adapter, "extract_id"):
            return adapter.extract_id(parsed_url)
        return None
    
    
    #attempt internal conversion to the right kind of adapter and convert into a list of download jobs
    def expand_jobs(self, url: str) -> list[DownloadJob]:
        adapter, parsed_url = self._get_adapter(url)

        if adapter and hasattr(adapter, "expand_jobs"):
            return adapter.expand_jobs(parsed_url)
        return []






    

if __name__ == "__main__":
    # Configure basic console logging so we can see the logger output
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    print("\n--- Initializing LinkAdapter ---")
    adapter = LinkAdapter()

    # List of various URLs to test the routing logic
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
        # Spotify Track URL
        "https://open.spotify.com/track/4PTG3Z6ehGkBF3zI7YgR63?si=another_param",
        # Missing scheme (http/https) check
        "youtu.be/dQw4w9WgXcQ",
        # Unsupported Domain (Should gracefully fail/warn)
        "https://soundcloud.com/some-artist/some-track"
    ]

    print("\n--- Running Link Extractions ---")
    for url in test_urls:
        print(f"\nInput: {url}")
        extracted_id = adapter.extract_id(url)
        print(f"Result: {extracted_id}")
