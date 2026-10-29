from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import (
    ConversationResponse,
    ConversationDetailResponse,
    ConversationCreate,
    ConversationUpdate,
    MessageResponse,
)

router = APIRouter()

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).order_by(Conversation.updated_at.desc()).all()
    results = []
    for c in conversations:
        msg_count = db.query(func.count(Message.id)).filter(Message.conversation_id == c.id).scalar() or 0
        results.append(
            ConversationResponse(
                id=c.id,
                title=c.title,
                mode=c.mode,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=msg_count,
            )
        )
    return results

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(req: ConversationCreate, db: Session = Depends(get_db)):
    conv = Conversation(
        title=req.title or "New Conversation",
        mode=req.mode or "standard",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        mode=conv.mode,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0,
    )

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    
    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        mode=conv.mode,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[MessageResponse.model_validate(m) for m in messages],
    )

@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    req: ConversationUpdate,
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if req.title is not None:
        conv.title = req.title
    if req.mode is not None:
        conv.mode = req.mode

    db.commit()
    db.refresh(conv)
    msg_count = db.query(func.count(Message.id)).filter(Message.conversation_id == conv.id).scalar() or 0
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        mode=conv.mode,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=msg_count,
    )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return None
