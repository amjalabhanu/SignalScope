class ExtractionError(Exception):
    """Base exception for document extraction failures."""


class ExtractionValidationError(ExtractionError):
    """Raised when AI output is invalid or fails schema validation."""


class ExtractionEmptyResponseError(ExtractionError):
    """Raised when the AI provider returns no usable response."""


class ExtractionRateLimitError(ExtractionError):
    """Raised when the AI provider rate-limits the request."""


class ExtractionTemporaryError(ExtractionError):
    """Raised for temporary provider or network failures."""