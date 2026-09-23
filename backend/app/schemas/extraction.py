from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.services.event_types import normalize_event_type


class EntityCandidate(BaseModel):
    name: str = Field(min_length=1)
    type: str

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Entity name cannot be empty")

        return value

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in {"company", "product"}:
            raise ValueError(f"Unsupported entity type: {value}")

        return value


class EventCandidate(BaseModel):
    event_type: str
    primary_entity_name: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    attributes: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, value: str) -> str:
        return normalize_event_type(value)

    @field_validator("primary_entity_name", "summary")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Value cannot be empty")

        return value


class ExtractionResult(BaseModel):
    entities: list[EntityCandidate] = Field(default_factory=list)
    events: list[EventCandidate] = Field(default_factory=list)