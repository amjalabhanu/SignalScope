import json

import pytest

from app.schemas.interpretation import EventInterpretationResult
from app.services.ai_interpretation import interpret_event
from app.services.extraction_errors import (
    ExtractionEmptyResponseError,
    ExtractionValidationError,
)


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeModels:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error

    def generate_content(self, **kwargs):
        if self.error:
            raise self.error
        return self.response


class FakeClient:
    def __init__(self, response=None, error=None):
        self.models = FakeModels(response=response, error=error)


def valid_payload():
    return {
        "status": "generated",
        "significance": "A meaningful product update.",
        "why_it_matters": "It may affect product usage.",
        "impact_areas": [
            {
                "area": "product",
                "explanation": "Product behavior may change.",
                "basis": "The event describes a product update.",
            }
        ],
        "known_facts": ["A product update was announced."],
        "qualified_implications": ["Users may need to adapt."],
        "uncertainties": ["The rollout timeline is unknown."],
    }


def test_interpret_event_success(monkeypatch):
    response = FakeResponse(json.dumps(valid_payload()))

    monkeypatch.setattr(
        "app.services.ai_interpretation.get_gemini_client",
        lambda: FakeClient(response=response),
    )

    result = interpret_event("An event with supporting evidence.")

    assert isinstance(result, EventInterpretationResult)
    assert result.status == "generated"
    assert result.impact_areas[0].area == "product"


def test_interpret_event_without_context():
    result = interpret_event("")

    assert result.status == "insufficient_evidence"
    assert result.uncertainties == ["No event evidence was supplied."]


def test_interpret_event_empty_response(monkeypatch):
    response = FakeResponse("")

    monkeypatch.setattr(
        "app.services.ai_interpretation.get_gemini_client",
        lambda: FakeClient(response=response),
    )

    with pytest.raises(ExtractionEmptyResponseError):
        interpret_event("Some event context.")


def test_interpret_event_invalid_json(monkeypatch):
    response = FakeResponse("not valid json")

    monkeypatch.setattr(
        "app.services.ai_interpretation.get_gemini_client",
        lambda: FakeClient(response=response),
    )

    with pytest.raises(ExtractionValidationError):
        interpret_event("Some event context.")


def test_interpret_event_invalid_schema(monkeypatch):
    invalid_payload = {
        "status": "generated",
        "impact_areas": [
            {
                "area": "unsupported_area",
                "explanation": "Invalid.",
                "basis": "Invalid.",
            }
        ],
    }

    response = FakeResponse(json.dumps(invalid_payload))

    monkeypatch.setattr(
        "app.services.ai_interpretation.get_gemini_client",
        lambda: FakeClient(response=response),
    )

    with pytest.raises(ExtractionValidationError):
        interpret_event("Some event context.")