import logging
import asyncio
import time
import re
import httpx

from core.models.track import TrackBase
from core.models.artist import ArtistBase
from core.musicbrainz.exceptions import MusicBrainzClientError, MusicBrainzServerError

logger = logging.getLogger(__name__)


class MusicBrainzClient():
    def __init__(
        self,
        **overrides
    ):
        self.mb_prefix: str = "MB__"

        self.base_url = "https://musicbrainz.org/ws/2"
        self.headers = {
            "User-Agent": "ScuttleMusicSearch/0.1.0 ( https://github.com/whimsypingu/scuttle-it )",
            "Accept": "application/json",
        }

        self.default_params = {
            "fmt": "json",
        }

        self.maximum_total_wait = 3

        for key, value in overrides.items():
            if hasattr(self, key):
                setattr(self, key, value)
            else:
                logger.warning(f"MusicBrainzClient ignored unknown override: {key}")


        self._lock = asyncio.Lock()

        #declare after headers are set and possibly overwritten
        self.client = httpx.AsyncClient(
            headers=self.headers,
            timeout=10.0,
            follow_redirects=True,
        )

        self._special_chars_pattern = re.compile(r'[()\[\]/]')

        logger.info(f"MusicBrainzClient ready.")

    async def close(self):
        await self.client.aclose()


    def _contains_special_chars(self, text):
        return bool(re.search(self._special_chars_pattern, text))

    def _normalize_text(self, text):
        return text.lower()


    async def _get(self, endpoint: str, params: dict = None):
        """
        Queries MusicBrainz servers, using retry mechanism based on response headers.

        Args:
            endpoint (str): MusicBrainz entity to search ("recordings", "artists", etc)
            params (dict): Custom parameter overrides. Defaults to internal default_params.

        Returns:
            response.json

        Raises:
            MusicBrainzServerError: If the MusicBrainz server returns a non-503 failure status response.
            MusicBrainzClientError: If any other issue happens (timing out, etc)
        """
        logger.info(f"Querying {self.base_url}/{endpoint}...")

        async with self._lock:

            params = self.default_params | (params or {})

            start = time.time()
            next_wait = 0

            while time.time() < start + self.maximum_total_wait:

                await asyncio.sleep(next_wait)

                try:
                    #network request
                    response = await self.client.get(f"{self.base_url}/{endpoint}", params=params)

                    if response.status_code == 200:
                        return response.json()

                    #when MB rejects the request, check to see if we can retry by setting next_wait to the Retry-After header in the response
                    elif response.status_code == 503: #see: https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
                        retry_after_header = response.headers.get("Retry-After")
                        if retry_after_header is not None:
                            try:
                                next_wait = float(retry_after_header)
                            except ValueError:
                                next_wait = 0
                        else:
                            next_wait = 0
                        continue

                    else:
                        response.raise_for_status()

                except httpx.HTTPStatusError as e:
                    raise MusicBrainzServerError() from e
                except Exception as e:
                    raise MusicBrainzClientError() from e

            raise MusicBrainzClientError() #possibly due to rate limiting fall-thru


    async def match_record(self, track: TrackBase, score_threshold: float = 0.95) -> bool:
        """
        Takes a TrackBase and tries to search and retrieve a match. If found, edits in place and returns True.

        score_threshold: 0.95 (clamped between 0 and 1)
        """
        title = track.display
        artists = '" OR "'.join([a.display for a in track.artists])

        lucene_query = f'recording:"{title}" AND artist:("{artists}")'

        search_params = {
            "query": lucene_query,
            "limit": 1,
        }

        #fetch data from mb
        try:
            data = await self._get(endpoint="recording", params=search_params)
        except httpx.HTTPError as e:
            logger.error(f"HTTP request failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Error fetching record: {e}")
            return False

        #extract and check score if available
        recordings = data.get("recordings", [])
        if not recordings:
            logger.info(f"No recordings for query: {lucene_query}")
            return False

        r = recordings[0]
        score = r.get("score", 0)
        if score < (score_threshold * 100):
            logger.info(f"Top result score ({score}) below threshold ({score_threshold * 100})")
            return False
        
        #replace in-place if valid data is found, no .get()s because malformed data should result in exit
        try:
            new_title = r["title"]
            new_artists = []
            for ac in r["artist-credit"]:
                a = ac["artist"]

                new_artists.append(ArtistBase(
                    id=f"{self.mb_prefix}{a['id']}",
                    name=a["name"],
                ))

            track.title_display = new_title
            track.artists = new_artists

            return True

        except Exception as e:
            logger.info(f"Failed to parse record: {e}")

        return False


    async def enrich_artist(self, artist: ArtistBase, limit: int = 200) -> list[TrackBase]:
        """
        Takes an ArtistBase and tries to retrieve corresponding artists. If found, edits in place and returns True.
        """
        if not artist.id.startswith(self.mb_prefix):
            logger.error(f"Artist cannot be enriched, invalid id: {artist.id}")
            return []

        result_set = {}
        result_set_first_release_date = {}

        iteration = 0
        retrievable = 100
        retrieved_count = 100 #initial to start the loop
        total_retrieved = 0

        exclusions = (
            '-status:"pseudo-release" -status:withdrawn -status:expunged -status:cancelled '
            '-primarytype:bradcast -primarytype:other '
            '-secondarytype:"mixtape/street" -secondarytype:"dj-mix" -secondarytype:remix '
            '-secondarytype:live -secondarytype:interview -secondarytype:spokenword'
        )

        search_query = f'arid:{artist.id.removeprefix(self.mb_prefix)} {exclusions}'

        try:
            while retrieved_count >= retrievable and limit > 0:
                search_params = {
                    "query": search_query,
                    "limit": retrievable,
                    "offset": total_retrieved,
                }

                data = await self._get(endpoint="recording", params=search_params)

                #process
                retrieved = data.get("recordings", [])
                for r in retrieved:

                    #handle valid id scrape
                    track_mbid = r.get("id", None)
                    if not track_mbid:
                        continue

                    #handle title existence and basic cleanliness
                    title = r.get("title", None)
                    if (not title) or self._contains_special_chars(title):
                        continue

                    #handle valid duration and convert to seconds
                    duration = r.get("length", 0)
                    if duration <= 0:
                        continue
                    else:
                        duration_sec = duration // 1000

                    #handle artist entries
                    artist_credit = r.get("artist-credit", [])
                    artist_data = []
                    all_artists_valid = True
                    for ac in artist_credit:
                        name = ac.get("name", "").strip()
                        artist_mbid = ac.get("artist", {}).get("id", "").strip()

                        #validate extracted artist fields
                        if not name or not artist_mbid:
                            all_artists_valid = False
                            break

                        artist_data.append(
                            ArtistBase(
                                id=f"{self.mb_prefix}{artist_mbid}",
                                name=name,
                            )
                        )
                    if not artist_credit or not all_artists_valid:
                        continue

                    #handle release date and keep discard more recent duplicate entries
                    first_release_date = r.get("first-release-date", "9999-00-00")
                    existing_date = result_set_first_release_date.get(self._normalize_text(title), "9999-99-99")
                    if first_release_date > existing_date:
                        continue
                    else:
                        result_set_first_release_date[self._normalize_text(title)] = first_release_date

                    #put together the output for this track entry
                    track_data = TrackBase(
                        id=f"{self.mb_prefix}{track_mbid}",
                        title=title,
                        duration=duration_sec,
                        artists=artist_data,
                    )

                    result_set[self._normalize_text(title)] = track_data

                #total_count = data.get("recording-count", data.get("count", 9999))
                retrieved_count = len(retrieved)
                total_retrieved += retrieved_count
                limit -= retrieved_count
                iteration += 1
    
            return list(result_set.values())

        except Exception as e:
            logger.info(f"Failed to extract enriched artist data: {e}")

        return []


