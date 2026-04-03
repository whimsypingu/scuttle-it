from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class ScuttleBase(BaseModel):
    """Shared config for all Scuttle models"""
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True, #allows loading from sql rows
        populate_by_name=True, #useful if sql column names differ from python
        validate_assignment=True #re-validates if changing an attribute
    )