from fastapi import APIRouter

# APIRouter keeps health-related routes separate from main.py.
router = APIRouter()


@router.get("/health")
def health_check():
    # This endpoint confirms that the FastAPI application is running.
    return {"status": "ok"}