import logging
import re
from urllib.parse import parse_qs

from core.models.jobs import DownloadJob

logger = logging.getLogger(__name__)


class YouTubeAdapter:
    def __init__(self):
        self._id_pattern = re.compile(r'^[a-zA-Z0-9_-]{11}$') #https://dev.to/muhammadsaim/discover-the-magic-behind-youtubes-unique-video-ids-21ll

    def extract_id(self, parsed_url: str) -> str | None:
        #first check the query v parameter which is most common, looks like ?v=dQw4w9WgXcQ
        q = parse_qs(parsed_url.query)
        v = q.get("v") #returns a list: ["dQw4w9WgXcQ"]
        if v:
            potential_id = v[0]
            if self._id_pattern.match(potential_id):
                return potential_id
            
        #check any part of the path, like /v/dQw4w9WgXcQ
        for path_part in parsed_url.path.split("/"):
            if self._id_pattern.match(path_part):
                return path_part
        return None

    def expand_jobs(self, parsed_url: str) -> list[DownloadJob]:
        extracted_id = self.extract_id(parsed_url)
        if extracted_id is not None:
            return [
                DownloadJob(
                    track_id=extracted_id,
                    priority=True,
                )
            ]
        return []