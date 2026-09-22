# SignalScope

SignalScope is a Domain Intelligence Platform that tracks companies, products, and meaningful events from external data sources.

The platform is designed to help users follow entities, discover important developments, and inspect the evidence behind detected events.

## Current Capabilities

- Entity storage and discovery
- Company and product tracking
- Event detection and storage
- Evidence and source document linking
- RSS-based ingestion
- Finnhub price tracking
- PostgreSQL persistence
- Redis infrastructure
- FastAPI backend
- Demo data seeding for local development

---

## Architecture

```text
External Sources
      |
      v
Ingestion Layer
(RSS / Finnhub)
      |
      v
Processing Layer
(Entity + Event Extraction)
      |
      v
PostgreSQL
(Entities, Events, Documents, Evidence)
      |
      v
FastAPI
      |
      v
Frontend
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Python, FastAPI |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Cache / Infrastructure | Redis 7 |
| Containerization | Docker Compose |
| Data Sources | RSS, Finnhub |
| Frontend | See `frontend/` |

---

## Prerequisites

Install the following software:

- Docker Desktop
- Git

Verify your installation:

```bash
docker --version
docker compose version
git --version
```

---

## Clone the Repository

```bash
git clone <repository-url>
cd SignalScope
```

Replace `<repository-url>` with the actual repository URL.

---

## Environment Configuration

Create a local environment file from the example:

```bash
cp backend/.env.example backend/.env
```

The environment file contains configuration for:

- PostgreSQL
- Redis
- OpenAI API
- Finnhub API

Example structure:

```env
DATABASE_URL=postgresql://signalscope:signalscope_password@postgres:5432/signalscope
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=your_openai_api_key_here
FINNHUB_API_KEY=your_finnhub_api_key_here
```

Update API keys if you intend to run external ingestion or AI-powered processing.

The demo seed does not require external API keys.

**Never commit real API keys, passwords, or other secrets.**

---

## Start the Application

From the project root, run:

```bash
docker compose up --build -d
```

This starts:

- PostgreSQL
- Redis
- FastAPI backend

Check service status:

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs backend
```

---

## Application URLs

Once the containers are running:

| Service | URL |
|---|---|
| Backend API | http://localhost:8000 |
| Health Check | http://localhost:8000/health |
| API Documentation | http://localhost:8000/docs |
| Alternative API Docs | http://localhost:8000/redoc |

---

## Database Migrations

Apply all available migrations:

```bash
docker compose exec backend alembic upgrade head
```

Check the current migration:

```bash
docker compose exec backend alembic current
```

Check the latest migration head:

```bash
docker compose exec backend alembic heads
```

The current database revision should match the latest migration head.

---

## Seed Demo Data

SignalScope includes a repeatable demo seed script for local development.

The seed creates example:

- Entities
- Events
- Source documents
- Event evidence links

Run:

```bash
docker compose exec backend python -m app.seed_demo
```

The demo data includes:

- Tesla
- Instacart
- Roblox
- Roadster

### Idempotency

The seed script is idempotent.

Running it multiple times does not create duplicate:

- Entities
- Documents
- Events
- Evidence links

You can safely run the command again whenever you need to populate a development database.

---

## Verify the API

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### List Entities

```bash
curl http://localhost:8000/entities
```

For formatted JSON:

```bash
curl -s http://localhost:8000/entities | python3 -m json.tool
```

### List Events

```bash
curl http://localhost:8000/events
```

For formatted JSON:

```bash
curl -s http://localhost:8000/events | python3 -m json.tool
```

### List Event Evidence

```bash
curl http://localhost:8000/event-evidence
```

For formatted JSON:

```bash
curl -s http://localhost:8000/event-evidence | python3 -m json.tool
```

Event evidence includes source information such as:

- Document title
- Source name
- Source URL
- Publication timestamp

---

## Project Structure

```text
SignalScope/
├── README.md
├── docker-compose.yml
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── seed_demo.py
│   │   ├── seed_tickers.py
│   │   │
│   │   ├── ingestion/
│   │   │   ├── finnhub_connector.py
│   │   │   ├── rss_connector.py
│   │   │   ├── run_extraction.py
│   │   │   └── run_rss.py
│   │   │
│   │   ├── processing/
│   │   │   ├── run_event_extraction.py
│   │   │   └── run_price_tracking.py
│   │   │
│   │   ├── models/
│   │   │   ├── document.py
│   │   │   ├── document_entity.py
│   │   │   ├── entity.py
│   │   │   ├── entity_attribute_history.py
│   │   │   ├── event.py
│   │   │   └── event_evidence.py
│   │   │
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   ├── entities.py
│   │   │   ├── events.py
│   │   │   ├── documents.py
│   │   │   └── event_evidence.py
│   │   │
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── .env.example
│   ├── Dockerfile
│   └── alembic.ini
│
└── frontend/
    └── README.md
```

---

## Database Entities

The current database includes the following core tables:

| Table | Purpose |
|---|---|
| `entities` | Companies and products tracked by SignalScope |
| `documents` | Raw source documents and metadata |
| `document_entities` | Links documents to entities |
| `events` | Detected developments involving entities |
| `event_evidence` | Links events to supporting documents |
| `entity_attribute_history` | Historical entity attribute changes |
| `alembic_version` | Database migration version tracking |

---

## Stop the Application

Stop containers while preserving database volumes:

```bash
docker compose down
```

Stop containers and delete persisted PostgreSQL and Redis volumes:

```bash
docker compose down -v
```

**Warning:** The `-v` option permanently deletes local database and Redis data stored in Docker volumes.

---

## Restart the Application

Restart existing containers:

```bash
docker compose restart
```

Rebuild and start the application:

```bash
docker compose up --build -d
```

---

## Troubleshooting

### View Backend Logs

```bash
docker compose logs backend
```

Follow backend logs live:

```bash
docker compose logs -f backend
```

### View All Service Logs

```bash
docker compose logs
```

### Check Running Containers

```bash
docker compose ps
```

### Check Database Migration State

```bash
docker compose exec backend alembic current
```

```bash
docker compose exec backend alembic heads
```

### Reapply Migrations

```bash
docker compose exec backend alembic upgrade head
```

### Reset the Local Database

**This deletes local database data.**

```bash
docker compose down -v
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed_demo
```

---

## Development Notes

- Run backend commands inside the Docker container.
- Do not rely on a local Python installation.
- Keep secrets in local environment files.
- Do not commit `.env` files containing real credentials.
- Use the demo seed script for reproducible local development data.
- Avoid manually modifying database records during normal development.
- Create Alembic migrations for database schema changes.

---

## Current Status

Sprint 0 focuses on making the project reproducible for developers cloning the repository.

The current setup supports:

- Docker-based local development
- Database migrations
- API health verification
- Entity and event APIs
- Evidence inspection
- Repeatable demo data seeding