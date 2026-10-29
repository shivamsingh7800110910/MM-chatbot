import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.schemas.document import (
    DocumentResponse,
    DocumentCreateRequest,
    DocumentReviseRequest,
    DocumentAskRequest,
    DocumentAskResponse,
)
from app.core.config import settings
from app.services.rag_service import rag_service
from app.services.document_service import document_service
from app.services.llm_service import llm_service

router = APIRouter()

@router.post("/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    db: Session = Depends(get_db),
):
    """
    Uploads a document (PDF, DOCX, TXT, MD, CSV), extracts text, chunks it, and indexes vector embeddings.
    """
    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)

    filename = file.filename or "uploaded_document"
    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    doc_id = str(uuid.uuid4())
    save_path = os.path.join(upload_dir, f"{doc_id[:8]}_{filename}")

    # Write file to disk
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_size = os.path.getsize(save_path)
    doc_title = title or os.path.splitext(filename)[0].replace("_", " ").title()

    doc = Document(
        id=doc_id,
        title=doc_title,
        filename=filename,
        file_type=ext or "txt",
        file_path=save_path,
        file_size=file_size,
        version=1,
        is_generated=False,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Ingest chunks and embeddings
    chunk_count = await rag_service.ingest_document(db, doc)

    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        version=doc.version,
        parent_id=doc.parent_id,
        is_generated=doc.is_generated,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunk_count=chunk_count,
    )

@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        c_count = db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.document_id == d.id).scalar() or 0
        results.append(
            DocumentResponse(
                id=d.id,
                title=d.title,
                filename=d.filename,
                file_type=d.file_type,
                file_size=d.file_size,
                version=d.version,
                parent_id=d.parent_id,
                is_generated=d.is_generated,
                created_at=d.created_at,
                updated_at=d.updated_at,
                chunk_count=c_count,
            )
        )
    return results

@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    c_count = db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.document_id == doc.id).scalar() or 0
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        version=doc.version,
        parent_id=doc.parent_id,
        is_generated=doc.is_generated,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunk_count=c_count,
    )

@router.post("/documents/{document_id}/ask", response_model=DocumentAskResponse)
async def ask_document(
    document_id: str,
    req: DocumentAskRequest,
    db: Session = Depends(get_db),
):
    """
    Asks a question strictly grounded in the specified document using vector RAG.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    scored_chunks = await rag_service.search_relevant_chunks(
        db=db,
        query=req.question,
        document_id=doc.id,
        top_k=4,
    )
    citations = rag_service.build_citations(scored_chunks)

    if not scored_chunks:
        return DocumentAskResponse(
            answer=f"I reviewed the document '{doc.title}', but could not find information relevant to your question: \"{req.question}\".",
            citations=[],
        )

    system_instruction = (
        f"You are a strict document analysis assistant grounded in the document '{doc.title}'. "
        "Answer the user's question using ONLY the retrieved excerpts from the document. "
        "If the document excerpts do not provide enough information to answer the question, "
        "explicitly state that the document does not contain that information rather than guessing."
    )

    answer = await llm_service.generate_response(
        prompt=req.question,
        system_instruction=system_instruction,
        citations=citations,
        mode="rag",
    )

    return DocumentAskResponse(answer=answer, citations=citations)

@router.post("/documents/create", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    req: DocumentCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Creates a new document from a natural language prompt or content instructions.
    """
    doc = await document_service.create_document_from_prompt(
        db=db,
        title=req.title,
        content_or_prompt=req.content_or_prompt,
        file_type=req.file_type or "md",
    )
    c_count = db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.document_id == doc.id).scalar() or 0
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        version=doc.version,
        parent_id=doc.parent_id,
        is_generated=doc.is_generated,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunk_count=c_count,
    )

@router.post("/documents/{document_id}/revise", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def revise_document(
    document_id: str,
    req: DocumentReviseRequest,
    db: Session = Depends(get_db),
):
    """
    Revises an existing document and creates a new version, preserving the original upload/version.
    """
    try:
        revised_doc = await document_service.revise_document(
            db=db,
            document_id=document_id,
            instructions=req.instructions,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    c_count = db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.document_id == revised_doc.id).scalar() or 0
    return DocumentResponse(
        id=revised_doc.id,
        title=revised_doc.title,
        filename=revised_doc.filename,
        file_type=revised_doc.file_type,
        file_size=revised_doc.file_size,
        version=revised_doc.version,
        parent_id=revised_doc.parent_id,
        is_generated=revised_doc.is_generated,
        created_at=revised_doc.created_at,
        updated_at=revised_doc.updated_at,
        chunk_count=c_count,
    )

@router.get("/documents/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    """
    Downloads the document file.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File content not found on server")

    file_path, filename, media_type = document_service.get_download_info(doc)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
    )
