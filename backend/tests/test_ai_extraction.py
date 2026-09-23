import json
from unittest.mock import MagicMock, patch

import pytest

from app.services.ai_extraction import extract_document_information
from app.services.extraction_errors import (
    ExtractionEmptyResponseError,
    ExtractionValidationError,ExtractionRateLimitError,ExtractionTemporaryError,
)

def mock_gemini_response(payload: dict) -> MagicMock:
    response = MagicMock()
    response.text = json.dumps(payload)
    return response


def test_extract_document_information_returns_valid_result():
    payload = {
        "entities": [
            {"name": "Acme", "type": "company"},
            {"name": "Acme Phone", "type": "product"},
        ],
        "events": [
            {
                "event_type": "product_launch",
                "primary_entity_name": "Acme Phone",
                "summary": "Acme launched Acme Phone.",
                "attributes": {"category": "smartphone"},
            }
        ],
    }

    with patch("app.services.ai_extraction.get_gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.return_value = (
            mock_gemini_response(payload)
        )

        result = extract_document_information("Acme launched Acme Phone.")

    assert len(result.entities) == 2
    assert len(result.events) == 1
    assert result.events[0].event_type == "product_launch"


def test_extract_document_information_returns_empty_for_blank_document():
    result = extract_document_information("")

    assert result.entities == []
    assert result.events == []


def test_extract_document_information_rejects_invalid_json():
    response = MagicMock()
    response.text = "not valid json"

    with patch("app.services.ai_extraction.get_gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.return_value = response

        with pytest.raises(ExtractionValidationError, match="invalid JSON"):
            extract_document_information("Some document text")


def test_extract_document_information_rejects_unsupported_event_type():
    payload = {
        "entities": [],
        "events": [
            {
                "event_type": "stock_prediction",
                "primary_entity_name": "Acme",
                "summary": "Prediction",
            }
        ],
    }

    with patch("app.services.ai_extraction.get_gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.return_value = (
            mock_gemini_response(payload)
        )

        with pytest.raises(ExtractionValidationError, match="validation"):
            extract_document_information("Some document text")


def test_extract_document_information_rejects_empty_response():
    response = MagicMock()
    response.text = None

    with patch("app.services.ai_extraction.get_gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.return_value = response

        with pytest.raises(ExtractionEmptyResponseError, match="empty response"):
            extract_document_information("Some document text")
def test_extract_document_information_classifies_rate_limit_error():
    with patch("app.services.ai_extraction.get_gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.side_effect = (
            Exception("429 RESOURCE_EXHAUSTED")
        )

        with pytest.raises(ExtractionRateLimitError):
            extract_document_information("Some document text")


def test_extract_document_information_classifies_timeout_error():
    with patch("app.services.ai_extraction.get_gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.side_effect = (
            TimeoutError("request timeout")
        )

        with pytest.raises(ExtractionTemporaryError):
            extract_document_information("Some document text")


def test_extract_document_information_classifies_unknown_provider_error():
    with patch("app.services.ai_extraction.get_gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.side_effect = (
            RuntimeError("unexpected provider failure")
        )

        with pytest.raises(ExtractionTemporaryError):
            extract_document_information("Some document text")