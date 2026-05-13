from enum import Enum
from typing import Any, Optional

from core.models.jobs import DownloadJob
from pydantic import BaseModel

#see: scuttle/apps/web-client/src/store/sync/sync.constants.ts
#see: scuttle/apps/web-client/src/store/sync/sync.types.ts
class WSPokeType(str, Enum):
    DOWNLOAD_JOB_STATUS_UPDATE = "DOWNLOAD_JOB_STATUS_UPDATE"


#make sure to serialize everything before so no objects break the websocket connections
class WSPoke(BaseModel):
    type: WSPokeType
    payload: Optional[Any] = None

class WSPokeFactory:
    @staticmethod
    def download_job_status_update(job: DownloadJob) -> dict:
        return {
            "type": WSPokeType.DOWNLOAD_JOB_STATUS_UPDATE,
            "payload": job.model_dump(by_alias=True)
        }
    