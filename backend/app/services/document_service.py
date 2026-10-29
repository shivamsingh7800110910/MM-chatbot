import os
import uuid
from typing import Tuple
from sqlalchemy.orm import Session
from app.models.document import Document
from app.core.config import settings
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service

class DocumentService:
    def __init__(self):
        self.upload_dir = os.path.abspath(settings.UPLOAD_DIR)
        os.makedirs(self.upload_dir, exist_ok=True)

    async def create_document_from_prompt(
        self,
        db: Session,
        title: str,
        content_or_prompt: str,
        file_type: str = "md",
    ) -> Document:
        """
        Generates document content using natural language prompt and saves it as a new document.
        """
        file_type = file_type.lower().lstrip(".")
        if file_type not in ["md", "txt", "docx"]:
            file_type = "md"

        # Ask LLM to draft structured document
        system_instruction = (
            "You are an expert technical and professional document author. "
            "Generate high-quality, comprehensive, well-formatted documents using clean Markdown structure."
        )
        prompt = (
            f"Please generate a complete, structured document titled '{title}'.\n\n"
            f"Requirements & Instructions:\n{content_or_prompt}"
        )

        generated_text = await llm_service.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            mode="standard",
        )

        # Save to file
        doc_id = str(uuid.uuid4())
        safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).rstrip().replace(" ", "_")
        filename = f"{safe_title}_{doc_id[:8]}.{file_type}"
        file_path = os.path.join(self.upload_dir, filename)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(generated_text)

        file_size = os.path.getsize(file_path)

        doc = Document(
            id=doc_id,
            title=title,
            filename=filename,
            file_type=file_type,
            file_path=file_path,
            file_size=file_size,
            version=1,
            content_text=generated_text,
            is_generated=True,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Ingest for RAG
        await rag_service.ingest_document(db, doc)
        return doc

    async def revise_document(
        self,
        db: Session,
        document_id: str,
        instructions: str,
    ) -> Document:
        """
        Creates a new version of the document based on revision instructions, preserving the original.
        """
        original = db.query(Document).filter(Document.id == document_id).first()
        if not original:
            raise ValueError("Original document not found")

        current_content = original.content_text or ""
        if not current_content and os.path.exists(original.file_path):
            with open(original.file_path, "r", encoding="utf-8", errors="ignore") as f:
                current_content = f.read()

        system_instruction = (
            "You are an expert document editor. Revise, improve, or restructure the provided document "
            "strictly according to the revision instructions. Output the complete revised document text."
        )
        prompt = (
            f"Document Title: {original.title}\n"
            f"Current Version: v{original.version}\n\n"
            f"Revision Instructions:\n{instructions}\n\n"
            f"Original Document Content:\n\"\"\"\n{current_content}\n\"\"\""
        )

        revised_text = await llm_service.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            mode="standard",
        )

        # Create new version record
        new_version_num = (original.version or 1) + 1
        new_id = str(uuid.uuid4())
        safe_title = "".join(c for c in original.title if c.isalnum() or c in (" ", "_", "-")).rstrip().replace(" ", "_")
        filename = f"{safe_title}_v{new_version_num}_{new_id[:8]}.{original.file_type}"
        file_path = os.path.join(self.upload_dir, filename)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(revised_text)

        file_size = os.path.getsize(file_path)

        revised_doc = Document(
            id=new_id,
            title=f"{original.title} (v{new_version_num})",
            filename=filename,
            file_type=original.file_type,
            file_path=file_path,
            file_size=file_size,
            version=new_version_num,
            parent_id=original.id,
            content_text=revised_text,
            is_generated=True,
        )
        db.add(revised_doc)
        db.commit()
        db.refresh(revised_doc)

        await rag_service.ingest_document(db, revised_doc)
        return revised_doc

    def get_download_info(self, doc: Document) -> Tuple[str, str, str]:
        """Returns (file_path, filename, media_type)"""
        mime_map = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "txt": "text/plain",
            "md": "text/markdown",
            "csv": "text/csv",
        }
        media_type = mime_map.get(doc.file_type.lower(), "application/octet-stream")
        return doc.file_path, doc.filename, media_type

document_service = DocumentService()
