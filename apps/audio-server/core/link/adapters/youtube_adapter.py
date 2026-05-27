import logging
import re
from core.models.payloads import CreatePlaylistPayload
import httpx
from urllib.parse import parse_qs

from core.models.jobs import DownloadJob

logger = logging.getLogger(__name__)


class YouTubeAdapter:
    def __init__(self):
        self._headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        self._timeout = 15.0

        self._track_id_pattern = re.compile(r'^[a-zA-Z0-9_-]{11}$') #https://dev.to/muhammadsaim/discover-the-magic-behind-youtubes-unique-video-ids-21ll
        self._playlist_id_pattern = re.compile(r'^[a-zA-Z0-9_-]{16,50}$') #google gemini lied about it being alphanumeric between 16-34 chars, couldnt find a source so this is a minor safety check
        self._playlist_pattern = re.compile(r'"videoId"\s*:\s*"([a-zA-Z0-9-_]{11})"') #all youtube links are hidden in this regex, there may be duplicates


    def extract_id(self, parsed_url: str) -> tuple[str | None, str | None]:
        """Attempts to find the YouTube id from a parsed url. Returns link_type as a string of 'playlist' or 'track', and extracted_id."""
        #first check the query v= parameter which is most common, looks like ?v=dQw4w9WgXcQ
        q = parse_qs(parsed_url.query)
        v = q.get("v") #returns a list: ["dQw4w9WgXcQ"]
        if v:
            potential_id = v[0]
            if self._track_id_pattern.match(potential_id):
                return "track", potential_id
            
        #check any part of the path, like /v/dQw4w9WgXcQ. less robust but fast and concise codewise
        for path_part in parsed_url.path.split("/"):
            if self._track_id_pattern.match(path_part):
                return "track", path_part
            
        #when track is not found, then fallthru search for playlist id in query list= parameter, can also check for /playlist/ path but not necessary probably
        li = q.get("list") #returns a list: ["PLbpi6ZahtOH75Gj-P-YZYV6hSY5SHQKeV"] 
        if li:
            potential_id = li[0]
            if self._playlist_id_pattern.match(potential_id):
                return "playlist", potential_id
        return None, None
    

    async def _resolve_playlist_to_track_ids(self, id) -> list[str]:
        """Internally handle converting a playlist url to a list of track_ids ["track_id"...]"""
        search_url = f"https://www.youtube.com/playlist?list={id}"

        async with httpx.AsyncClient(headers=self._headers, timeout=self._timeout) as client:
            try:
                response = await client.get(search_url)
                m = self._playlist_pattern.findall(response.text) #searches for "videoId":"XX" as regex
                return list(dict.fromkeys(m))
            except Exception as e:
                logger.error(f"Failed to playlist track metadata from YouTube: {e}")
        return []


    async def expand_jobs(self, parsed_url: str) -> tuple[list[DownloadJob], CreatePlaylistPayload | None]:
        """Given a parsed url, attempt to return a list of DownloadJobs, either a single track in a list or a playlist."""
        link_type, extracted_id = self.extract_id(parsed_url)
        if link_type == "track":
            if extracted_id is not None:
                return [
                    DownloadJob(
                        track_id=extracted_id,
                        priority=True,
                    )
                ], None
        elif link_type == "playlist":
            track_ids = await self._resolve_playlist_to_track_ids(extracted_id)
            return [
                DownloadJob(
                    track_id=t,
                    priority=False,
                ) for t in track_ids
            ], None
        return [], None