from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.health import router as health_router
from app.routers.events import router as events_router
from app.routers.entities import router as entities_router
from app.routers.documents import router as documents_router
from app.routers.event_evidence import router as event_evidence_router
from app.routers.auth import router as auth_router
from app.routers.subscriptions import router as subscriptions_router
from app.routers.feed import router as feed_router


app = FastAPI(title="SignalScope")


# Allow the local React development server to call the FastAPI API.
# Vite normally runs React on port 5173.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Keep health-related routes separate from the main application.
app.include_router(health_router)
app.include_router(events_router)
app.include_router(entities_router)
app.include_router(documents_router)
app.include_router(event_evidence_router)
app.include_router(auth_router)
app.include_router(subscriptions_router)
app.include_router(feed_router)