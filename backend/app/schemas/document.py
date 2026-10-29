from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.chat import CitationItem

class DocumentResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    file_size: int
    version: int
    parent_id: Optional[str] = None
    is_generated: bool
    created_at: datetime
    updated_at: datetime
    chunk_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class DocumentCreateRequest(BaseModel):
    title: str
    content_or_prompt: str
    file_type: Optional[str] = "md"

class DocumentReviseRequest(BaseModel):
    instructions: str

class DocumentAskRequest(BaseModel):
    question: str

class DocumentAskResponse(BaseModel):
    answer: str
    citations: List[CitationItem] = []
