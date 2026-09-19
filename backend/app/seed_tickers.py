from sqlalchemy import select

from app.database import SessionLocal
from app.models.entity import Entity


# This is a manual mapping for the MVP.
# We are NOT trying to automatically discover or resolve stock tickers.
# Automatic ticker resolution is intentionally out of scope for this sprint.
TICKER_MAPPINGS = {
    "Instacart": "CART",
    "Roblox": "RBLX",
    "Tesla": "TSLA",
}


def seed_tickers():
    db = SessionLocal()

    try:
        updated = 0
        skipped = 0

        for entity_name, ticker in TICKER_MAPPINGS.items():
            statement = select(Entity).where(
                Entity.name == entity_name,
                Entity.type == "company",
            )

            entity = db.scalar(statement)

            if entity is None:
                print(f"Entity not found: {entity_name}")
                skipped += 1
                continue

            entity.ticker_symbol = ticker
            updated += 1

            print(f"Updated: {entity.name} -> {ticker}")

        db.commit()

        print("\nTicker seed summary")
        print(f"Updated: {updated}")
        print(f"Skipped: {skipped}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_tickers()