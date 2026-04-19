from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel

class WSPokeType(str, Enum):
    DOWNLOAD_JOB_SUCCESS = "DOWNLOAD_JOB_SUCCESS"
    DOWNLOAD_JOB_ERROR = "DOWNLOAD_JOB_ERROR"

class WSPoke(BaseModel):
    type: WSPokeType
    payload: Optional[Any] = None

class WSPokeFactory:
    @staticmethod
    def download_job_success():
        return {
            "type": WSPokeType.DOWNLOAD_JOB_SUCCESS,
            "payload": None
        }
    
    @staticmethod
    def download_job_error():
        return {
            "type": WSPokeType.DOWNLOAD_JOB_ERROR,
            "payload": None
        }