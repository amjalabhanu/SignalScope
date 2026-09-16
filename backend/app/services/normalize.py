import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup


# Convert RSS data into the format expected by the documents table.
def normalize_rss_item(item):
    # RSS descriptions often contain HTML.
    # Convert that HTML into clean readable text.
    raw_content = item["description"]

    content = BeautifulSoup(
        raw_content,
        "html.parser",
    ).get_text(" ", strip=True)

    # Create a SHA-256 hash from the cleaned text.
    # The same readable content produces the same hash
    # even if the surrounding HTML changes.
    content_hash = hashlib.sha256(
        content.encode("utf-8")
    ).hexdigest()

    # Convert the RSS publication time into a timezone-aware datetime.
    # Some RSS items may not provide a publication date.
    # In that case, use the current UTC time.
    if item["published"] is not None:
        published_at = datetime(
            *item["published"][:6],
            tzinfo=timezone.utc,
        )
    else:
        published_at = datetime.now(timezone.utc)

    # Return data matching the documents table.
    return {
        "source_type": "rss",
        "source_name": "TechCrunch",
        "raw_title": item["title"],
        "raw_content": content,
        "source_url": item["link"],
        "content_hash": content_hash,
        "published_at": published_at,
    }