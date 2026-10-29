import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.image import ImageGenerateRequest, ImageGenerateResponse
from app.services.image_service import image_service

router = APIRouter()

@router.post("/image/generate", response_model=ImageGenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate_ai_image(
    req: ImageGenerateRequest,
    db: Session = Depends(get_db),
):
    try:
        result = await image_service.generate_image(
            prompt=req.prompt,
            aspect_ratio=req.aspect_ratio or "1:1",
            style=req.style or "realistic",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

    # If conversation_id is supplied, record message with image attachment
    if req.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == req.conversation_id).first()
        if conv:
            msg = Message(
                conversation_id=conv.id,
                role="assistant",
                content=f"🎨 I generated this image based on your prompt: *\"{req.prompt}\"* (Style: {req.style}, Ratio: {req.aspect_ratio})",
                attachments=[
                    {
                        "name": f"Generated_{result['image_id'][:8]}.png",
                        "type": "image",
                        "url": result.get("data_url") or result["image_url"],
                        "size": os.path.getsize(result["file_path"]) if os.path.exists(result["file_path"]) else 0,
                    }
                ],
                citations=[],
            )
            db.add(msg)
            conv.updated_at = datetime.now(timezone.utc)
            db.commit()

    return ImageGenerateResponse(
        image_id=result["image_id"],
        image_url=result["image_url"],
        data_url=result.get("data_url"),
        prompt=result["prompt"],
        aspect_ratio=result["aspect_ratio"],
        style=result["style"],
    )

@router.get("/image/{image_id}")
def get_image_file(image_id: str):
    upload_dir = image_service.upload_dir
    file_path = os.path.join(upload_dir, f"{image_id}.png")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(file_path, media_type="image/png")
