import json
import logging
import re

from core.models.jobs import DownloadJob
import httpx

logger = logging.getLogger(__name__)


class SpotifyAdapter:
    def __init__(self):
        self._headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.google.com/"
        }
        self._timeout = 15.0

        self._id_pattern = re.compile(r'^[a-zA-Z0-9]{22}$') #https://community.spotify.com/t5/Spotify-for-Developers/API-What-defines-a-valid-Spotify-ID/td-p/5069603 nobody replied?
        self._title_artist_pattern = re.compile(r'"title":"([^"]+)".*?"artists":\s*(\[.*?\])', re.DOTALL)

    def extract_id(self, parsed_url: str) -> str | None:
        """Attempts to find the Spotify id from a parsed url"""
        #check any part of the path, like /track/4PTG3Z6ehGkBFwjybzWkR8
        for path_part in parsed_url.path.split("/"):
            if self._id_pattern.match(path_part):
                return path_part
        return None
    
    
    async def resolve_metadata(self, parsed_url) -> dict | None:
        track_id = self.extract_id(parsed_url)
        if not track_id:
            logger.warning(f"Could not extract a valid Spotify ID from path: {parsed_url.path}")
            return None

        # Hit the unauthenticated endpoint that handles standard web embedding queries
        oembed_url = f"https://open.spotify.com/oembed?url=spotify:track:{track_id}"
        oembed_url = f"https://open.spotify.com/embed/track/{track_id}"

        async with httpx.AsyncClient(headers=self._headers, timeout=5.0) as client:
            try:
                response = await client.get(oembed_url)
                if response.status_code == 200:
                    print("\n=== PRETTY PRINTED HTML RESPONSE ===")
                    m = self._title_artist_pattern.search(response.text)
                    if m:
                        track_title = m.group(1)
                        raw_artists_json = m.group(2)

                        print(track_title, raw_artists_json)

                        try:
                            artists_data = json.loads(raw_artists_json)
                            artist_names = ", ".join([artist.get("name") for artist in artists_data])
                        except json.JSONDecodeError:
                            logger.error("Extracted artists string wasn't perfectly clean JSON.")

                    print("=====================================\n")
                    return None
                                    
                if response.status_code != 200:
                    logger.warning(f"Spotify oEmbed API returned status {response.status_code} for ID: {track_id}")
                    return None
                
                data = response.json()
                print(data)
                
                #formulate a clean dict payload matching what Scuttle's download pipeline expects
                return {
                    "id": track_id,
                    "title": data.get("title"),
                    "artist": data.get("author_name"),  # Spotify maps primary artists to 'author_name'
                    "search_query": f"{data.get('author_name')} - {data.get('title')}"
                }

            except httpx.HTTPError as e:
                logger.error(f"Network error while fetching Spotify metadata for {track_id}: {str(e)}")
                return None


    def expand_jobs(self, parsed_url: str) -> list[DownloadJob]:
        """Given a parsed url, attempt to return a list of DownloadJobs, either a single track in a list or a playlist."""
        extracted_id = self.extract_id(parsed_url)
        if extracted_id is not None:
            return [
                DownloadJob(
                    track_id=extracted_id,
                    priority=True,
                )
            ]
        return []