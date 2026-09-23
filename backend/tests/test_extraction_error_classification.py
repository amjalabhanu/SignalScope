from app.services.classify_extraction_error import classify_extraction_error
from app.services.extraction_errors import (
    ExtractionEmptyResponseError,
    ExtractionRateLimitError,
    ExtractionTemporaryError,
    ExtractionValidationError,
)


def test_preserves_existing_extraction_error():
    error = ExtractionEmptyResponseError("empty")

    result = classify_extraction_error(error)

    assert result is error


def test_classifies_rate_limit_error():
    result = classify_extraction_error(Exception("429 RESOURCE_EXHAUSTED"))

    assert isinstance(result, ExtractionRateLimitError)


def test_classifies_timeout_as_temporary_error():
    result = classify_extraction_error(TimeoutError("request timeout"))

    assert isinstance(result, ExtractionTemporaryError)


def test_classifies_unavailable_provider_as_temporary_error():
    result = classify_extraction_error(Exception("503 service unavailable"))

    assert isinstance(result, ExtractionTemporaryError)


def test_classifies_value_error_as_validation_error():
    result = classify_extraction_error(ValueError("invalid JSON"))

    assert isinstance(result, ExtractionValidationError)


def test_classifies_unknown_error_as_temporary_error():
    result = classify_extraction_error(RuntimeError("unexpected provider failure"))

    assert isinstance(result, ExtractionTemporaryError)