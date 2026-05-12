from enum import Enum
from typing import Any, Optional

from core.models.jobs import DownloadJob
from pydantic import BaseModel

#see: scuttle/apps/web-client/src/store/sync/sync.constants.ts
#see: scuttle/apps/web-client/src/store/sync/sync.types.ts
class WSPokeType(str, Enum):
    DOWNLOAD_JOB_SUCCESS = "DOWNLOAD_JOB_SUCCESS"
    DOWNLOAD_JOB_ERROR = "DOWNLOAD_JOB_ERROR"


#make sure to serialize everything before so no objects break the websocket connections
class WSPoke(BaseModel):
    type: WSPokeType
    payload: Optional[Any] = None

class WSPokeFactory:
    @staticmethod
    def download_job_success(job: DownloadJob) -> dict:
        return {
            "type": WSPokeType.DOWNLOAD_JOB_SUCCESS,
            "payload": job.model_dump()
        }
    
    @staticmethod
    def download_job_error(job: DownloadJob) -> dict:
        return {
            "type": WSPokeType.DOWNLOAD_JOB_ERROR,
            "payload": job.model_dump()
        }