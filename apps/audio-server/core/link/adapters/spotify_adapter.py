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
        self._track_pattern = re.compile(r'"title":"([^"]+)".*?"artists":\s*(\[.*?\])', re.DOTALL)
        self._playlist_pattern = re.compile(r'"title":"([^"]+)".*?"subtitle":"([^"]+)"', re.DOTALL)


    def _clean(self, text):
        return text.replace("\xa0", " ")

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


    async def _resolve_track_to_query(self, id) -> str | None:
        """Internally handle converting a track url to a query (track - artists)"""
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
                logger.error(f"Failed to resolve track metadata from Spotify")
        return None
        

    async def _resolve_playlist_to_queries(self, id) -> list[str] | None:
        """Internally handle converting a playlist url to a list of queries [(track - artists)...]"""
        embed_url = f"https://open.spotify.com/embed/playlist/{id}"
        
        async with httpx.AsyncClient(headers=self._headers, timeout=self._timeout) as client:
            try:
                response = await client.get(embed_url)
                #print(response.text)
                m = self._playlist_pattern.findall(response.text)

                queries = []
                for title, artist in m:
                    queries.append(self._clean(f"{title.strip()} - {artist.strip()}"))

                return queries[1:] #ignore the playlist title and author
            except Exception as e:
                logger.error(f"Failed to resolve track metadata from Spotify: {e}")
        return None


    async def expand_jobs(self, parsed_url: str) -> list[DownloadJob]:
        """Given a parsed url, attempt to return a list of DownloadJobs, either a single track in a list or a playlist."""
        link_type, extracted_id = self.extract_id(parsed_url)
        if link_type == "track":
            query = await self._resolve_track_to_query(extracted_id)
            if query is not None:
                return [
                    DownloadJob(
                        query=query,
                        priority=True,
                    )
                ]
        elif link_type == "playlist":
            queries = await self._resolve_playlist_to_queries(extracted_id)
            if queries is not None:
                return [
                    DownloadJob(
                        query=query,
                        priority=False,
                    ) for query in queries
                ]
        return []