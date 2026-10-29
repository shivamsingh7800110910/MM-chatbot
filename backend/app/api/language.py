from typing import List
from fastapi import APIRouter
from app.schemas.language import (
    TranslateRequest,
    TranslateResponse,
    LanguageExplainRequest,
    LanguageExplainResponse,
    ToneAnalysisRequest,
    ToneAnalysisResponse,
    SupportedLanguageItem,
)
from app.services.language_service import language_service

router = APIRouter()

@router.get("/language/supported", response_model=List[SupportedLanguageItem])
def get_supported_languages():
    return language_service.get_supported_languages()

@router.post("/language/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    result = await language_service.translate_text(
        text=req.text,
        target_lang=req.target_language,
        source_lang=req.source_language,
    )
    return TranslateResponse(**result)

@router.post("/language/explain", response_model=LanguageExplainResponse)
async def explain_phrase(req: LanguageExplainRequest):
    result = await language_service.explain_language(
        phrase=req.phrase,
        target_lang=req.target_language,
        level=req.learner_level or "intermediate",
    )
    return LanguageExplainResponse(**result)

@router.post("/language/tone", response_model=ToneAnalysisResponse)
async def analyze_tone(req: ToneAnalysisRequest):
    result = await language_service.analyze_tone_and_sentiment(text=req.text)
    return ToneAnalysisResponse(**result)
