from app.schemas.extraction import ExtractionResult


def has_usable_extraction(result: ExtractionResult) -> bool:
    """
    Return True when the extraction contains at least one entity or event.
    """
    return bool(result.entities or result.events)