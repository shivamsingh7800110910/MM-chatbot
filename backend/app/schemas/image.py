from typing import Optional
from pydantic import BaseModel, Field

class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Prompt describing the image to generate")
    aspect_ratio: Optional[str] = Field("1:1", description="1:1, 16:9, 9:16, 4:3, or 3:4")
    style: Optional[str] = Field("realistic", description="realistic, anime, digital_art, cinematic, 3d_render, watercolor, cyberpunk")
    conversation_id: Optional[str] = None

class ImageGenerateResponse(BaseModel):
    image_id: str
    image_url: str
    data_url: Optional[str] = None
    prompt: str
    aspect_ratio: str
    style: str
