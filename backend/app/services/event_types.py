import re


SUPPORTED_EVENT_TYPES = {
    "price_change",
    "product_launch",
    "product_announcement",
    "partnership",
    "platform_update",
}


def normalize_event_type(event_type: str) -> str:
    """
    Normalize an event type into its canonical representation.

    Examples:
        "Price Change" -> "price_change"
        "PRICE-CHANGE" -> "price_change"
        " product_launch " -> "product_launch"
    """
    if not isinstance(event_type, str):
        raise ValueError("event_type must be a string")

    normalized = re.sub(
        r"[^a-z0-9]+",
        "_",
        event_type.strip().lower(),
    ).strip("_")

    if normalized not in SUPPORTED_EVENT_TYPES:
        raise ValueError(
            f"Unsupported event type: {event_type}"
        )

    return normalized