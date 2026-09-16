import feedparser

FEED_URL = "https://techcrunch.com/feed/"


def fetch_rss_items():
    feed = feedparser.parse(FEED_URL)

    items = []

    for entry in feed.entries:
        items.append(
            {
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "description": entry.get("description", ""),
                "published": entry.get("published_parsed"),
            }
        )

    return items