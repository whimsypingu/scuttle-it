import json
import logging
import re
import httpx

from core.models.jobs import DownloadJob
from core.models.payloads import CreatePlaylistPayload

from core.link.exceptions import PlaylistResolutionError, TrackResolutionError

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
        self._track_pattern = re.compile(r'"title":"([^"]+)".*?"artists":\s*(\[.*?\])', re.DOTALL)
        self._playlist_pattern = re.compile(r'"title":"([^"]+)".*?"subtitle":"([^"]+)"', re.DOTALL)


    def _clean(self, text):
        return text.replace("\xa0", " ").strip()

    def extract_id(self, parsed_url: str) -> tuple[str | None, str | None]:
        """Attempts to find the Spotify id from a parsed url. Returns link_type as a string of 'playlist' or 'track', and extracted_id."""
        #check any part of the path, like /track/4PTG3Z6ehGkBFwjybzWkR8
        path_parts = [p for p in parsed_url.path.split("/") if p]
        if len(path_parts) < 2:
            return None, None
        
        link_type = path_parts[0].lower()   # "track" or "playlist"
        potential_id = path_parts[1]        # 4PTG3Z6ehGkBFwjybzWkR8

        if not self._id_pattern.match(potential_id) or (link_type not in ("track", "playlist")):
            return None, None
        return link_type, potential_id


    async def _resolve_track(self, id) -> str:
        """Internally handle converting a track url to a query "track - artists" like this"""
        embed_url = f"https://open.spotify.com/embed/track/{id}"

        async with httpx.AsyncClient(headers=self._headers, timeout=self._timeout) as client:
            try:
                response = await client.get(embed_url)
                m = self._track_pattern.search(response.text)

                #try catch block will catch any errors
                title = m.group(1)
                artists = ", ".join([a.get("name") for a in json.loads(m.group(2))])
                return self._clean(f"{title} - {artists}")
            except Exception as e:
                raise TrackResolutionError(f"Failed to resolve track metadata from Spotify") from e
        

    async def _resolve_playlist(self, id) -> tuple[str, str, list[tuple[str, str]]]:
        """Extracts the tracks and metadata of a Spotify playlist via an embed proxy layout.

        This method scrapes the raw underlying HTML response from a proxy shell, parses out 
        the playlist's structural definition fields, isolates the target search strings, 
        and maps them cleanly into formatted worker query components.

        Args:
            id: The unique, alphanumeric string identifier of the target Spotify playlist.

        Returns:
            A tuple containing:
                - str: The sanitized name of the playlist.
                - str: The sanitized creator or description metadata block.
                - list[tuple[str, str]]: A list of cleanly formatted "Track Title - Artist Name" strings
                  representing every discovered item inside the playlist.

        Raises:
            PlaylistResolutionError(): If the remote network endpoint returns an error,
                the HTML response payload is empty, or the internal regex extraction parser 
                fails to locate compliant tracks inside the structure frame.
        """
        embed_url = f"https://open.spotify.com/embed/playlist/{id}"
        
        async with httpx.AsyncClient(headers=self._headers, timeout=self._timeout) as client:
            try:
                response = await client.get(embed_url)

                # === DEBUGGING ===
                # with open("spotify_dump.html", "w", encoding="utf-8") as f:
                #     f.write(response.text)

                m = self._playlist_pattern.findall(response.text)

                queries = []
                name = None
                description = None

                for i, (title, artist) in enumerate(m):
                    if i == 0:
                        name = self._clean(title)
                        description = self._clean(artist) #spotify embed links don't contain the actual description, so we will just use the user instead
                    else:
                        queries.append(
                            (self._clean(title), self._clean(artist))
                        )
                        #queries.append(self._clean(f"{title.strip()} - {artist.strip()}"))

                if name is None: #for whatever reason if somehow a playlist name is not extracted raise an error
                    raise AttributeError()
                
                return name, description, queries
            except Exception as e:
                raise PlaylistResolutionError(f"Failed to resolve playlist metadata from Spotify: {e}") from e
            

    async def expand_jobs(self, parsed_url: str) -> tuple[list[DownloadJob], CreatePlaylistPayload | None]:
        """Given a parsed url, attempt to return a list of DownloadJobs, either a single track in a list or a playlist."""
        link_type, extracted_id = self.extract_id(parsed_url)

        if not extracted_id:
            return [], None
        
        if link_type == "track":
            try:
                query = await self._resolve_track(extracted_id)

                job = DownloadJob(query=query, priority=True)
                return [job], None
            except TrackResolutionError as e:
                logger.error(e)
                return [], None

        if link_type == "playlist":
            try:
                name, description, queries = await self._resolve_playlist(extracted_id)

                jobs = []
                for q in queries:
                    jobs.append(
                        DownloadJob(
                            query=f"{q[0]} - {q[1]}",
                            priority=False,
                            playlist_ids=[extracted_id],
                            title_display=q[0],
                            artist_display=q[1],
                        )
                    )
                    
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