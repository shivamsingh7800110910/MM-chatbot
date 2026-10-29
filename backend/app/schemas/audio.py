from typing import Optional
from pydantic import BaseModel

class TranscribeResponse(BaseModel):
    text: str
    language: Optional[str] = "en"

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"
    language: Optional[str] = "en"

class SynthesizeResponse(BaseModel):
    audio_base64: str
    mime_type: str = "audio/mp3"
