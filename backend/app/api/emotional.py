from fastapi import APIRouter
from app.services.emotional_service import emotional_service

router = APIRouter()

@router.get("/emotional/resources")
def get_emotional_resources():
    """
    Returns guided reflection prompts, coping exercises, and emotional assistance resources.
    """
    return emotional_service.get_prompts_and_exercises()
