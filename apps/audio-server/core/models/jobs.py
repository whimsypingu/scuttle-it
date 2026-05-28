import time
import uuid
from enum import Enum
from core.models.base import ScuttleBase
from pydantic import Field, model_validator


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobBase(ScuttleBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    #cast to int to drop fp microseconds and have simple int based field for date
    created_at: int = Field(default_factory=lambda: int(time.time()))

    status: JobStatus = JobStatus.PENDING


class DownloadJob(JobBase):
    track_id: str | None = None
    query: str | None = None
    
    query_limit: int = Field(default=3, ge=1, le=10)
    
    to_queue: bool = True #do we put this in the queue after download
    priority: bool = False #is it important or not for queue priority, if to_queue is true
    playlist_ids: list[str] | None = None #list of playlist IDs, if instantiating

    @model_validator(mode="after")
    def validate_constraints(self) -> "DownloadJob":
        #mutual exclusivity check (either track_id or query, but not both or neither)
        if not self.track_id and not self.query:
            raise ValueError("DownloadJob must have either a track_id or a query.")        
        if self.track_id and self.query:
            raise ValueError("DownloadJob cannot have both a track_id and a query.")
        
        return self
    
    @property
    def identifier(self) -> str:
        """Returns whichever identifier is available, which validator ensures."""
        return self.track_id or self.query