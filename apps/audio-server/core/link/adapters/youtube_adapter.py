import logging
import re
import httpx
from urllib.parse import parse_qs

from core.models.jobs import DownloadJob
from core.models.payloads import CreatePlaylistPayload

from core.link.exceptions import PlaylistResolutionError

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

        self._playlist_name_desc_pattern = re.compile(r'"title"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]*)"')
        self._playlist_video_id_pattern = re.compile(r'"videoId"\s*:\s*"([a-zA-Z0-9-_]{11})"') #all youtube links are hidden in this regex, there may be duplicates


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
    

    async def _resolve_playlist(self, playlist_id) -> tuple[str | None, str | None, list[str]]:
        """Extracts the tracks and metadata of a YouTube playlist via an embed proxy layout.

        This method scrapes the raw underlying HTML response from a proxy shell, parses out 
        the playlist's structural definition fields, isolates the target search strings, 
        and maps them cleanly into formatted worker query components.

        Args:
            id: The unique, alphanumeric string identifier of the target YouTube playlist.

        Returns:
            A tuple containing:
                - str: The name of the playlist.
                - str: The description metadata block.
                - list[str]: A list of cleanly formatted "Track ID" strings
                  representing every discovered item inside the playlist.

        Raises:
            PlaylistResolutionError(): If the remote network endpoint returns an error,
                the HTML response payload is empty, or the internal regex extraction parser 
                fails to locate compliant tracks inside the structure frame.
        """
        search_url = f"https://www.youtube.com/playlist?list={playlist_id}"

        async with httpx.AsyncClient(headers=self._headers, timeout=self._timeout) as client:
            try:
                response = await client.get(search_url)

                # === DEBUGGING ===
                # import json
                # yt_initial_data = json.loads(re.search(r'ytInitialData\s*=\s*({.*?});\s*</script>', response.text).group(1))
                # with open("yt_initial_data.json", "w", encoding="utf-8") as f:
                #     json.dump(yt_initial_data, f, indent=2, ensure_ascii=False)

                m = self._playlist_name_desc_pattern.search(response.text) #searches for "title":"XX","description":"XX" as regex
                name, description = m.groups()

                m = self._playlist_video_id_pattern.findall(response.text) #searches for "videoId":"XX" as regex
                track_ids = list(dict.fromkeys(m))

                return name, description, track_ids
            except Exception as e:
                raise PlaylistResolutionError(f"Failed to playlist track metadata from YouTube: {e}") from e


    async def expand_jobs(self, parsed_url: str) -> tuple[list[DownloadJob], CreatePlaylistPayload | None]:
        """Given a parsed url, attempt to return a list of DownloadJobs, either a single track in a list or a playlist."""
        link_type, extracted_id = self.extract_id(parsed_url)

        if not extracted_id:
            return [], None
        
        if link_type == "track":
            job = DownloadJob(track_id=extracted_id, priority=True)
            return [job], None
        
        if link_type == "playlist":
            try:
                name, description, track_ids = await self._resolve_playlist(extracted_id)

                jobs = [
                    DownloadJob(track_id=t, priority=False, playlist_ids=[extracted_id])
                    for t in track_ids
                ]
                payload = CreatePlaylistPayload(
                    playlist_id=extracted_id,
                    name=name,
                    description=description,
                )
                return jobs, payload
            except PlaylistResolutionError as e:
                logger.error(e)
                return [], None
        return [], None
