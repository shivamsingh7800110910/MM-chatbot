import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base
# Ensure all models are imported so Base has full metadata
import app.models  # noqa: F401

logger = logging.getLogger(__name__)

engine = None
SessionLocal = None

def init_db_engine():
    global engine, SessionLocal
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")

    try:
        if is_sqlite:
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            engine = create_engine(db_url, pool_pre_ping=True)
            # Try a quick test connection
            with engine.connect() as conn:
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    conn.commit()
                except Exception as ext_err:
                    logger.warning(f"Could not initialize pgvector extension: {ext_err}")
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database successfully connected using: {db_url.split('@')[-1] if '@' in db_url else db_url}")

    except Exception as e:
        logger.warning(f"Failed to connect to primary database ({db_url}): {e}")
        logger.info("Falling back to local SQLite database (sqlite:///./chatbot.db) for local execution...")
        fallback_url = "sqlite:///./chatbot.db"
        engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        Base.metadata.create_all(bind=engine)

init_db_engine()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
