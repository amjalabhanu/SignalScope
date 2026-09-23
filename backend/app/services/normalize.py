import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup


def normalize_rss_item(item):
    title = item.get("title", "").strip()
    source_url = item.get("link", "").strip()
    raw_content = item.get("description", "")

    if not title:
        raise ValueError("RSS item title cannot be empty")

    if not source_url:
        raise ValueError("RSS item URL cannot be empty")

    if not raw_content or not raw_content.strip():
        raise ValueError("RSS item description cannot be empty")

    content = BeautifulSoup(
        raw_content,
        "html.parser",
    ).get_text(" ", strip=True)

    if not content:
        raise ValueError("RSS item content cannot be empty")

    content_hash = hashlib.sha256(
        content.encode("utf-8")
    ).hexdigest()

    if item["published"] is not None:
        published_at = datetime(
            *item["published"][:6],
            tzinfo=timezone.utc,
        )
    else:
        published_at = datetime.now(timezone.utc)

    return {
        "source_type": "rss",
        "source_name": "TechCrunch",
        "raw_title": title,
        "raw_content": content,
        "source_url": source_url,
        "content_hash": content_hash,
        "published_at": published_at,
    }