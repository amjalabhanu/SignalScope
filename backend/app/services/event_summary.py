import re


def normalize_event_summary(summary: str) -> str:
    if not isinstance(summary, str):
        raise ValueError("Event summary must be a string")

    normalized = re.sub(r"\s+", " ", summary).strip()

    if not normalized:
        raise ValueError("Event summary cannot be empty")

    return normalized