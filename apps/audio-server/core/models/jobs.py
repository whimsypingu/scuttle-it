from pydantic import BaseModel, Field, model_validator

class DownloadJob(BaseModel):
    track_id: str | None = None
    query: str | None = None
    priority: bool = False #is it important or not

    query_limit: int = Field(default=3, ge=1, le=10)

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