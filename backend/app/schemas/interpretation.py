from typing import Literal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

IMPACT_AREAS = {
    "product",
    "platform",
    "partnership",
    "pricing",
    "operations",
    "customers",
    "competition",
    "technology",
    "market_context",
}


class ImpactArea(BaseModel):
    area: str
    explanation: str = Field(min_length=1)
    basis: str = Field(min_length=1)

    @field_validator("area")
    @classmethod
    def validate_area(cls, value: str) -> str:
        value = value.strip().lower()

        if value not in IMPACT_AREAS:
            raise ValueError(f"Unsupported impact area: {value}")

        return value


class EventInterpretationResult(BaseModel):
    status: Literal[
        "generated",
        "insufficient_evidence",
    ]

    significance: str | None = None
    why_it_matters: str | None = None

    impact_areas: list[ImpactArea] = Field(default_factory=list)

    known_facts: list[str] = Field(default_factory=list)

    qualified_implications: list[str] = Field(default_factory=list)

    uncertainties: list[str] = Field(default_factory=list)

    @field_validator(
        "significance",
        "why_it_matters",
    )
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None

    @field_validator(
        "known_facts",
        "qualified_implications",
        "uncertainties",
    )
    @classmethod
    def normalize_string_lists(
        cls,
        values: list[str],
    ) -> list[str]:
        return [
            value.strip()
            for value in values
            if value and value.strip()
        ]

class EventInterpretationResponse(BaseModel):
    id: UUID
    event_id: UUID
    status: str
    significance: str | None = None
    why_it_matters: str | None = None
    impact_areas: list[ImpactArea] = []
    known_facts: list[str] = []
    qualified_implications: list[str] = []
    uncertainties: list[str] = []
    generated_at: datetime | None = None
    prompt_version: str | None = None
    model_version: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }