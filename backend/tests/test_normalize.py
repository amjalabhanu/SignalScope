import pytest

from app.services.normalize import normalize_rss_item


def make_rss_item(**overrides):
    item = {
        "title": "Example Article",
        "link": "https://example.com/article",
        "description": "<p>Article content</p>",
        "published": None,
    }
    item.update(overrides)
    return item


def test_normalize_rss_item_returns_clean_document():
    result = normalize_rss_item(make_rss_item())

    assert result["raw_title"] == "Example Article"
    assert result["raw_content"] == "Article content"
    assert result["source_url"] == "https://example.com/article"
    assert result["source_type"] == "rss"
    assert result["source_name"] == "TechCrunch"
    assert result["content_hash"]


def test_normalize_rss_item_rejects_empty_title():
    with pytest.raises(ValueError, match="title"):
        normalize_rss_item(make_rss_item(title=""))


def test_normalize_rss_item_rejects_empty_url():
    with pytest.raises(ValueError, match="URL"):
        normalize_rss_item(make_rss_item(link=""))


def test_normalize_rss_item_rejects_empty_description():
    with pytest.raises(ValueError, match="description"):
        normalize_rss_item(make_rss_item(description=""))


def test_normalize_rss_item_rejects_html_without_text():
    with pytest.raises(ValueError, match="content"):
        normalize_rss_item(make_rss_item(description="<div></div>"))