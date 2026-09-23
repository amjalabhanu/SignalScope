import json
from typing import Any

from pydantic import ValidationError

from app.schemas.extraction import ExtractionResult
from app.services.ai_client import get_gemini_client
from app.services.ai_prompts import DOCUMENT_EXTRACTION_PROMPT
from app.services.classify_extraction_error import classify_extraction_error
from app.services.extraction_errors import (
    ExtractionEmptyResponseError,
    ExtractionValidationError,
)


def extract_document_information(document_text: str) -> ExtractionResult:
    """
    Extract and validate entities and events from a document using Gemini.

    This service performs no database operations.
    """

    if not document_text or not document_text.strip():
        return ExtractionResult(entities=[], events=[])

    client = get_gemini_client()

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                DOCUMENT_EXTRACTION_PROMPT
                + "\n\nDOCUMENT:\n"
                + document_text
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
            "Gemini returned an empty response"
        )

    try:
        payload: dict[str, Any] = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ExtractionValidationError(
            "Gemini returned invalid JSON"
        ) from exc

    try:
        return ExtractionResult.model_validate(payload)
    except ValidationError as exc:
        raise ExtractionValidationError(
            "Gemini response failed extraction validation"
        ) from exc