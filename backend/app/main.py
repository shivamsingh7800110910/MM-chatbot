import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import health, chat, conversations, documents, search, audio, emotional, image, language

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("multimodal_chatbot")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A beginner-friendly Multimodal AI Chatbot supporting Multimodal Chat, RAG, Web Search, Document Management, Emotional Assistance, AI Image Generation, and Language Intelligence.",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = settings.CORS_ORIGINS
if not origins or origins == ["*"]:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if isinstance(origins, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(conversations.router, prefix="/api", tags=["Conversations"])
app.include_router(documents.router, prefix="/api", tags=["Documents & RAG"])
app.include_router(search.router, prefix="/api", tags=["Web Search"])
app.include_router(audio.router, prefix="/api", tags=["Audio"])
app.include_router(emotional.router, prefix="/api", tags=["Emotional Assistance"])
app.include_router(image.router, prefix="/api", tags=["Image Generation"])
app.include_router(language.router, prefix="/api", tags=["Language Intelligence"])

import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Resolve workspace reports directory
REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../reports"))
os.makedirs(REPORTS_DIR, exist_ok=True)
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

@app.get("/api/reports/production-status-pdf", tags=["Reports"])
def download_production_status_pdf():
    pdf_path = os.path.join(REPORTS_DIR, "production_status_report.pdf")
    if not os.path.exists(pdf_path):
        from app.services.report_generator import generate_production_report_pdf
        generate_production_report_pdf(pdf_path)
    return FileResponse(
        path=pdf_path,
        filename="production_status_report.pdf",
        media_type="application/pdf",
    )

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "/api/health",
        "report_pdf": "/api/reports/production-status-pdf",
        "status": "online",
    }
