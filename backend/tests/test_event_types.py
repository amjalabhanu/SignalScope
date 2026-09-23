import pytest

from app.services.event_types import normalize_event_type
from app.services.event_summary import normalize_event_summary


def test_normalize_event_type_accepts_common_formats():
    assert normalize_event_type("Product Launch") == "product_launch"
    assert normalize_event_type("product-launch") == "product_launch"
    assert normalize_event_type("PRODUCT_LAUNCH") == "product_launch"


def test_normalize_event_type_preserves_canonical_value():
    assert normalize_event_type("price_change") == "price_change"


def test_normalize_event_type_rejects_unsupported_type():
    with pytest.raises(ValueError):
        normalize_event_type("random_event")

def test_normalize_event_summary_collapses_whitespace():
    result = normalize_event_summary(
        "  Product   launched\n successfully today  "
    )

    assert result == "Product launched successfully today"


def test_normalize_event_summary_rejects_empty_summary():
    with pytest.raises(ValueError):
        normalize_event_summary("   ")