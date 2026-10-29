from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    attachments: List[Any] = []
    citations: List[Any] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    mode: Optional[str] = "standard"

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    title: str
    mode: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    mode: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
