import logging
import os
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import embedding_service
from app.schemas.chat import CitationItem

logger = logging.getLogger(__name__)

class RAGService:
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Extracts readable text from PDF, DOCX, TXT, MD, CSV files.
        Returns full text and structured sections/pages.
        """
        file_type = file_type.lower().lstrip(".")
        sections = []
        full_text = ""

        try:
            if file_type == "pdf":
                import pypdf
                reader = pypdf.PdfReader(file_path)
                for idx, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        sections.append({"page_or_section": f"Page {idx + 1}", "text": page_text})
                        full_text += f"\n--- Page {idx + 1} ---\n" + page_text

            elif file_type in ("docx", "doc"):
                import docx
                doc = docx.Document(file_path)
                paras = [p.text for p in doc.paragraphs if p.text.strip()]
                full_text = "\n\n".join(paras)
                sections.append({"page_or_section": "Document Body", "text": full_text})

            else:  # txt, md, csv, etc.
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    full_text = f.read()
                sections.append({"page_or_section": "Document Content", "text": full_text})

        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            # Try plain text fallback
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    full_text = f.read()
                sections.append({"page_or_section": "Extracted Text", "text": full_text})
            except Exception:
                full_text = ""

        return full_text.strip(), sections

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 80) -> List[str]:
        """
        Splits text into manageable chunks with overlap, respecting paragraph / sentence boundaries.
        """
        if not text:
            return []

        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Start next chunk with overlap from previous
                    overlap_text = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else ""
                    current_chunk = (overlap_text + " " + para).strip()
                else:
                    # Para itself is longer than chunk_size, split by sentences or chunks
                    while len(para) > chunk_size:
                        split_idx = para[:chunk_size].rfind(". ")
                        if split_idx == -1:
                            split_idx = chunk_size
                        else:
                            split_idx += 1
                        chunks.append(para[:split_idx].strip())
                        para = para[split_idx:].strip()
                    current_chunk = para

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    async def ingest_document(self, db: Session, document: Document) -> int:
        """
        Extracts, chunks, embeds, and stores chunks for a document.
        Returns the number of indexed chunks.
        """
        full_text, sections = self.extract_text(document.file_path, document.file_type)
        document.content_text = full_text

        chunks = self.chunk_text(full_text)
        if not chunks:
            db.commit()
            return 0

        # Delete existing chunks if updating
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()

        chunk_count = 0
        for idx, chunk_content in enumerate(chunks):
            embedding = await embedding_service.get_embedding(chunk_content)
            chunk_record = DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                content=chunk_content,
                page_or_section=f"Section {idx + 1}",
                embedding=embedding,
            )
            db.add(chunk_record)
            chunk_count += 1

        db.commit()
        return chunk_count

    async def search_relevant_chunks(
        self,
        db: Session,
        query: str,
        document_id: str = None,
        top_k: int = 4,
        similarity_threshold: float = 0.15,
    ) -> List[Tuple[DocumentChunk, Document, float]]:
        """
        Performs vector similarity search across document chunks.
        Returns list of (DocumentChunk, Document, similarity_score).
        """
        query_embedding = await embedding_service.get_embedding(query)

        query_builder = db.query(DocumentChunk, Document).join(Document, DocumentChunk.document_id == Document.id)
        if document_id:
            query_builder = query_builder.filter(DocumentChunk.document_id == document_id)

        all_chunks = query_builder.all()
        scored_chunks = []

        for chunk, doc in all_chunks:
            if not chunk.embedding:
                continue
            sim = embedding_service.cosine_similarity(query_embedding, chunk.embedding)
            if sim >= similarity_threshold:
                scored_chunks.append((chunk, doc, sim))

        # Sort descending by similarity
        scored_chunks.sort(key=lambda x: x[2], reverse=True)
        return scored_chunks[:top_k]

    def build_citations(self, scored_chunks: List[Tuple[DocumentChunk, Document, float]]) -> List[CitationItem]:
        citations = []
        for chunk, doc, sim in scored_chunks:
            citations.append(
                CitationItem(
                    title=f"{doc.title} ({chunk.page_or_section or 'Excerpt'})",
                    url=f"/api/documents/{doc.id}/download",
                    snippet=chunk.content[:280] + ("..." if len(chunk.content) > 280 else ""),
                    source_type="document",
                )
            )
        return citations

rag_service = RAGService()
