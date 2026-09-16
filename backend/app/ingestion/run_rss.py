from app.ingestion.rss_connector import fetch_rss_items
from app.services.normalize import normalize_rss_item
from app.services.storage import store_documents


def run():
    # Step 1: Fetch raw items from the RSS feed.
    rss_items = fetch_rss_items()

    # Step 2: Convert every RSS item into our document format.
    documents = [
        normalize_rss_item(item)
        for item in rss_items
    ]

    # Step 3: Store the normalized documents in PostgreSQL.
    inserted, skipped = store_documents(documents)

    print(f"RSS items fetched: {len(rss_items)}")
    print(f"Documents inserted: {inserted}")
    print(f"Duplicates skipped: {skipped}")


if __name__ == "__main__":
    run()