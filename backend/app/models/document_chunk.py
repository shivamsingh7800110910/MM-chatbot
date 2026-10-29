import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_or_section = Column(String(100), nullable=True)
    embedding = Column(JSON, nullable=True)  # List of floats for cosine similarity search

    document = relationship("Document", back_populates="chunks")
