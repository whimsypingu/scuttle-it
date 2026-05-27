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
    async def expand_jobs(self, url: str) -> list[DownloadJob]:
        """
        Given a url, attempt to parse it with the optimal adapter and extract a list of DownloadJobs.
        A single track will be returned as a single DownloadJob in a list.
        Failure to find a result will return an empty list.
        """
        adapter, parsed_url = self._get_adapter(url)

        if adapter and hasattr(adapter, "expand_jobs"):
            return await adapter.expand_jobs(parsed_url)
        return []


import json
import re
import requests

# 1. Configuration & Robust Browser Headers
PLAYLIST_ID = "PLbpi6ZahtOH75Gj-P-YZYV6hSY5SHQKeV"  # Classic Rock Greatest Hits (Example)
URL = f"https://www.youtube.com/playlist?list={PLAYLIST_ID}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "max-age=0",
}

# 2. Targeted Alphanumeric 11-character Video ID pattern
VIDEO_ID_PATTERN = re.compile(r'\\?"videoId\\?"\s*:\s*\\?"([a-zA-Z0-9_-]{11})\\?"')
YT_INITIAL_DATA_PATTERN = re.compile(r'ytInitialData\s*=\s*({.*?});\s*</script>')

print(f"Dispatched tracking request to: {URL}\n")

try:
    # Set up the request with automatic redirect handling and a clean timeout
    response = requests.get(URL, headers=HEADERS, timeout=10, allow_redirects=True)
    
    print(f"--- SERVER RESPONSE ---")
    print(f"Status Code: {response.status_code}")
    print(f"Response Byte Length: {len(response.content)}")
    print(f"Content-Type: {response.headers.get('Content-Type')}\n")

    if response.status_code == 200 and response.text.strip():
        # Clean out non-breaking space bytes
        clean_html = response.text.replace("\xa0", " ")

        # Search for the object layout block
        match = YT_INITIAL_DATA_PATTERN.search(clean_html)
        
        if match:
            raw_json_string = match.group(1)
            
            # Convert string to python dictionary object
            yt_initial_data_json = json.loads(raw_json_string)
            
            print("✅ Successfully parsed ytInitialData into a JSON variable!\n")
            
            # Print the entire object cleanly formatted with indentation strings
            print(json.dumps(yt_initial_data_json, indent=2))
            
            # --- Optional: Save to file for easy deep inspection in your editor ---
            with open("yt_initial_data.json", "w", encoding="utf-8") as f:
                json.dump(yt_initial_data_json, f, indent=2)
            print("\n💾 Dumped payload output safely to 'yt_initial_data.json'")


            #try
            m = VIDEO_ID_PATTERN.findall(response.text)

            track_ids = []
            for t in m:
                track_ids.append(t)
            print(track_ids)

        else:
            print("❌ Regex match failed. Could not locate 'ytInitialData' statement block.")
    else:
        print("❌ Received an empty response target string or server failure.")

except requests.exceptions.RequestException as e:
    print(f"💥 Network request crashed: {e}")