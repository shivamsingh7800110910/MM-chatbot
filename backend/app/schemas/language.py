from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_language: str = Field("es", description="Target language code or name (e.g. es, fr, de, hi, ja)")
    source_language: Optional[str] = "auto"

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    target_language: str
    target_code: str
    source_language: str
    pronunciation: Optional[str] = None

class LanguageExplainRequest(BaseModel):
    phrase: str = Field(..., min_length=1)
    target_language: str = Field("en")
    learner_level: Optional[str] = "intermediate"

class LanguageExplainResponse(BaseModel):
    phrase: str
    detected_language: str
    target_language: str
    learner_level: str
    explanation: str

class ToneAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1)

class ToneAnalysisResponse(BaseModel):
    text: str
    language: str
    analysis: str

class SupportedLanguageItem(BaseModel):
    code: str
    name: str
    native: str
    flag: str
    speech_code: str
