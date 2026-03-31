from pydantic import BaseModel, Field, model_validator

class DownloadJob(BaseModel):
    track_id: str | None = None
    query: str | None = None

    priority: int = Field(default=100, ge=0) #lower number = higher priority

    @model_validator(mode="after")
    def check_id_or_query(self) -> "DownloadJob":
        if not self.track_id and not self.query:
            raise ValueError("DownloadJob must have either a track_id or a query.")
        
        if self.track_id and self.query:
            raise ValueError("DownloadJob cannot have both a track_id and a query.")
        
        return self