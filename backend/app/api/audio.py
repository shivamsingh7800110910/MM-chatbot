from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.audio import TranscribeResponse, SynthesizeRequest, SynthesizeResponse
from app.services.audio_service import audio_service

router = APIRouter()

@router.post("/audio/transcribe", response_model=TranscribeResponse)
async def transcribe_audio_file(file: UploadFile = File(...)):
    """
    Transcribes audio file to text using Gemini or speech recognition.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file provided")

    text = await audio_service.transcribe_audio(content, filename=file.filename or "recording.webm")
    return TranscribeResponse(text=text, language="en")

@router.post("/audio/synthesize", response_model=SynthesizeResponse)
def synthesize_text_speech(req: SynthesizeRequest):
    """
    Synthesizes spoken audio from text with multilingual support.
    """
    audio_base64 = audio_service.synthesize_speech(req.text, lang=req.language or "en")
    if not audio_base64:
        raise HTTPException(status_code=500, detail="Audio synthesis could not be generated")

    return SynthesizeResponse(audio_base64=audio_base64, mime_type="audio/mp3")
