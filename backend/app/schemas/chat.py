from typing import List, Optional
from pydantic import BaseModel, Field

class AttachmentItem(BaseModel):
    name: str
    type: str  # "image", "document", "audio"
    url: str  # file path, base64 data url, or public url
    size: Optional[int] = 0

class CitationItem(BaseModel):
    title: str
    url: Optional[str] = ""
    snippet: str
    source_type: str = "web"  # "web", "document"

class ChatMessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1, description="User prompt or message")
    mode: Optional[str] = "standard"  # "standard", "emotional", "rag", "search"
    attachments: Optional[List[AttachmentItem]] = []
    enable_search: Optional[bool] = False
    enable_rag: Optional[bool] = False
    document_id: Optional[str] = None
    synthesize_speech: Optional[bool] = False

class ChatMessageResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str = "assistant"
    content: str
    attachments: List[AttachmentItem] = []
    citations: List[CitationItem] = []
    audio_base64: Optional[str] = None
