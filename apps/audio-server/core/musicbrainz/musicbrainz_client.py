import logging
import asyncio
import time
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
        self.base_url = "https://musicbrainz.org/ws/2"
        self.headers = {
            "User-Agent": "ScuttleMusicSearch/0.1.0 ( https://github.com/whimsypingu/scuttle-it )",
            "Accept": "application/json",
        }

        self.default_params = {
            "fmt": "json",
        }

        # self._last_call = time.time()
        self._lock = asyncio.Lock()

        # self.minimum_wait = 1.1
        self.maximum_total_wait = 3

        for key, value in overrides.items():
            if hasattr(self, key):
                setattr(self, key, value)
            else:
                logger.warning(f"MusicBrainzClient ignored unknown override: {key}")

        #declare after headers are set and possibly overwritten
        self.client = httpx.AsyncClient(
            headers=self.headers,
            timeout=10.0,
            follow_redirects=True,
        )

        logger.info(f"MusicBrainzClient ready.")

    async def close(self):
        await self.client.aclose()


    async def _get(self, endpoint: str, params: dict = None):
        logger.info(f"Querying {self.base_url}/{endpoint}...")

        async with self._lock:

            params = self.default_params | (params or {})

            start = time.time()
            next_wait = 0

            while time.time() < start + self.maximum_total_wait:

                # if next_wait is None:
                #     #calculate time since last request
                #     elapsed = time.time() - self._last_call

                #     if elapsed < self.minimum_wait:
                #         await asyncio.sleep(self.minimum_wait)
                # else:
                #     await asyncio.sleep(next_wait)

                await asyncio.sleep(next_wait)

                try:
                    #network request
                    response = await self.client.get(f"{self.base_url}/{endpoint}", params=params)

                    # self._last_call = time.time()

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


    async def match_record(self, track: TrackBase, score_threshold=0.95) -> bool:
        """
        Takes a TrackBase and tries to search and retrieve a match. If found, edits in place and returns True.

        Still needs some kind of modifier logic for forcing a merge or overwrite on artist data ~~

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
                    id=a["id"],
                    name=a["name"],
                ))

            track.title_display = new_title
            track.artists = new_artists

            return True

        except Exception as e:
            logger.info(f"Failed to parse record: {e}")

        return False

