import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class SpotifyAdapter:
    def __init__(self):
        pass

    def extract_id(self, parsed_url: str) -> str | None:
        print(parsed_url)
        return None
