from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, CitationItem
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from app.services.search_service import search_service
from app.services.audio_service import audio_service
from app.services.emotional_service import emotional_service

router = APIRouter()

@router.post("/chat", response_model=ChatMessageResponse)
async def send_chat_message(
    req: ChatMessageRequest,
    db: Session = Depends(get_db),
):
    # 1. Resolve or create conversation
    conv = None
    if req.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == req.conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Generate initial title from first message
        title_snippet = req.message.strip().split("\n")[0][:40]
        conv = Conversation(title=title_snippet or "New Conversation", mode=req.mode or "standard")
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Persist user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=req.message,
        attachments=[att.model_dump() for att in (req.attachments or [])],
        citations=[],
    )
    db.add(user_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_msg)

    # 3. Retrieve context & citations
    citations: List[CitationItem] = []
    
    # RAG check
    if req.enable_rag or req.mode == "rag" or req.document_id:
        scored_chunks = await rag_service.search_relevant_chunks(
            db=db,
            query=req.message,
            document_id=req.document_id,
            top_k=4,
        )
        if scored_chunks:
            rag_citations = rag_service.build_citations(scored_chunks)
            citations.extend(rag_citations)

    # Web search check
    if req.enable_search or req.mode == "search":
        search_results = await search_service.search(query=req.message, max_results=4)
        if search_results:
            web_citations = search_service.to_citations(search_results)
            citations.extend(web_citations)

    # 4. Formulate System Prompt based on Mode
    system_instruction = "You are an intelligent, helpful, multimodal AI assistant."
    if req.mode == "emotional":
        system_instruction = emotional_service.SYSTEM_INSTRUCTION

    # Check crisis signals
    is_crisis = emotional_service.check_crisis(req.message)

    # Check image generation intent
    import re
    from app.services.image_service import image_service
    from app.services.language_service import language_service

    assistant_attachments = []
    image_match = re.search(r"(?i)\b(generate|create|draw|paint|render)\s+(an?\s+)?(image|picture|photo|artwork|illustration)\s+(of|with|depicting|showing)?\s*(.+)", req.message)
    if image_match:
        image_prompt = image_match.group(5).strip()
        if len(image_prompt) > 2:
            try:
                img_res = await image_service.generate_image(prompt=image_prompt, aspect_ratio="1:1", style="realistic")
                assistant_attachments.append(
                    AttachmentItem(
                        name=f"Generated_{img_res['image_id'][:8]}.png",
                        type="image",
                        url=img_res.get("data_url") or img_res["image_url"],
                        size=0,
                    )
                )
            except Exception as img_err:
                pass

    # 5. Load recent conversation history
    history_records = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    history = [
        {"role": m.role, "content": m.content}
        for m in history_records[-8:-1]  # Exclude current user message just inserted
    ]

    # 6. Generate AI response
    if assistant_attachments:
        response_text = f"🎨 I have generated an image for you based on: **\"{image_prompt}\"**.\n\nEnjoy the artwork! You can preview it in full resolution, download it, or ask me to modify the style or elements."
    else:
        response_text = await llm_service.generate_response(
            prompt=req.message,
            conversation_history=history,
            attachments=req.attachments,
            system_instruction=system_instruction,
            citations=citations,
            mode=req.mode or "standard",
        )

    # If crisis detected, append safety resources
    if is_crisis:
        response_text += emotional_service.SAFETY_RESOURCE_CARD

    # 7. Optional Text-To-Speech with language detection
    audio_base64 = None
    if req.synthesize_speech:
        lang_info = language_service.detect_language(response_text)
        audio_base64 = audio_service.synthesize_speech(response_text, lang=lang_info.get("code", "en"))

    # 8. Persist assistant message
    asst_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=response_text,
        attachments=[att.model_dump() for att in assistant_attachments],
        citations=[c.model_dump() for c in citations],
    )
    db.add(asst_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(asst_msg)

    return ChatMessageResponse(
        conversation_id=conv.id,
        message_id=asst_msg.id,
        role="assistant",
        content=response_text,
        attachments=assistant_attachments,
        citations=citations,
        audio_base64=audio_base64,
    )
