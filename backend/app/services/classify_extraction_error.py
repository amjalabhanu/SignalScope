from app.services.extraction_errors import (
    ExtractionEmptyResponseError,
    ExtractionError,
    ExtractionRateLimitError,
    ExtractionTemporaryError,
    ExtractionValidationError,
)


def classify_extraction_error(error: Exception) -> ExtractionError:
    """
    Convert provider and application errors into stable extraction errors.
    """

    if isinstance(error, ExtractionError):
        return error

    error_text = str(error).lower()
    error_name = type(error).__name__.lower()

    if (
        "429" in error_text
        or "rate limit" in error_text
        or "resource_exhausted" in error_text
        or "resourceexhausted" in error_name
    ):
        return ExtractionRateLimitError(str(error))

    if (
        "timeout" in error_text
        or "temporarily unavailable" in error_text
        or "service unavailable" in error_text
        or "503" in error_text
        or "unavailable" in error_name
    ):
        return ExtractionTemporaryError(str(error))

    if isinstance(error, ValueError):
        return ExtractionValidationError(str(error))

    return ExtractionTemporaryError(str(error))