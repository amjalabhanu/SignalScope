import json
from typing import Any

from pydantic import ValidationError

from app.schemas.interpretation import EventInterpretationResult
from app.services.ai_client import get_gemini_client
from app.services.classify_extraction_error import classify_extraction_error
from app.services.interpretation_prompts import (
    EVENT_INTERPRETATION_PROMPT,
    INTERPRETATION_PROMPT_VERSION,
)
from app.services.extraction_errors import (
    ExtractionEmptyResponseError,
    ExtractionValidationError,
)


def interpret_event(context: str) -> EventInterpretationResult:
    """
    Generate an evidence-grounded interpretation for an event.

    This service performs no database operations.
    """

    if not context or not context.strip():
        return EventInterpretationResult(
            status="insufficient_evidence",
            uncertainties=["No event evidence was supplied."],
        )

    client = get_gemini_client()

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                EVENT_INTERPRETATION_PROMPT
                + "\n\nEVENT CONTEXT:\n"
                + context
            ),
            config={
                "response_mime_type": "application/json",
            },
        )
    except Exception as exc:
        raise classify_extraction_error(exc) from exc

    raw_text = getattr(response, "text", None)

    if not raw_text or not raw_text.strip():
        raise ExtractionEmptyResponseError(
            "Gemini returned an empty interpretation response"
        )

    try:
        payload: dict[str, Any] = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ExtractionValidationError(
            "Gemini returned invalid interpretation JSON"
        ) from exc

    try:
        return EventInterpretationResult.model_validate(payload)
    except ValidationError as exc:
        raise ExtractionValidationError(
            "Gemini response failed interpretation validation"
        ) from exc