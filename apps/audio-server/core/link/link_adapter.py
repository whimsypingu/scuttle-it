import logging
from urllib.parse import urlparse

from core.link.adapters.spotify_adapter import SpotifyAdapter
from core.link.adapters.youtube_adapter import YouTubeAdapter
from core.models.jobs import DownloadJob
from core.models.payloads import CreatePlaylistPayload

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
            "open.spotify.com": SpotifyAdapter(),
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
    def extract_id(self, url: str) -> tuple[str | None, str | None]:
        """Extract an id with the optimal adapter. Returns link_type as a string of 'playlist' or 'track', and extracted_id."""
        adapter, parsed_url = self._get_adapter(url)

        if adapter and hasattr(adapter, "extract_id"):
            return adapter.extract_id(parsed_url)
        return None, None
    
    
    #attempt internal conversion to the right kind of adapter and convert into a list of download jobs
    async def expand_jobs(self, url: str) -> tuple[list[DownloadJob], CreatePlaylistPayload | None]:
        """Resolves a raw URL using the optimal adapter and extracts individual download jobs.

        This method acts as a router that identifies the correct source adapter 
        (e.g., YouTube, Spotify), parses the incoming URL, and flattens the target 
        media into granular worker tasks.

        Args:
            url: The raw, unparsed media or playlist URL from the client.

        Returns:
            A tuple containing:
                - list[DownloadJob]: A list of generated track download jobs. For a single
                  track, this contains one high-priority job. For a playlist, it contains
                  all extracted tracks mapped as lower-priority sibling jobs.
                - CreatePlaylistPayload | None: The structural metadata payload required 
                  to initialize the playlist in the database, or None if the incoming URL
                  was a single track or resolution failed.
        """
        adapter, parsed_url = self._get_adapter(url)

        if adapter and hasattr(adapter, "expand_jobs"):
            return await adapter.expand_jobs(parsed_url)
        return [], None

