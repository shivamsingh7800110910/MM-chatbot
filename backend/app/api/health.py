from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db, engine
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def check_health(db: Session = Depends(get_db)):
    db_status = "connected"
    db_backend = "unknown"
    try:
        # Check database connectivity
        db.execute(text("SELECT 1"))
        db_backend = engine.name if engine else "sqlite"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": {
            "status": db_status,
            "engine": db_backend,
        },
        "providers": {
            "default_llm": settings.DEFAULT_LLM_PROVIDER,
            "gemini_configured": bool(settings.GEMINI_API_KEY),
            "openai_configured": bool(settings.OPENAI_API_KEY),
            "search_provider": settings.SEARCH_PROVIDER,
            "tavily_configured": bool(settings.TAVILY_API_KEY),
        },
    }
