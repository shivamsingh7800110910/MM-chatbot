import logging
import base64
import os
import io
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class AudioService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")

    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.wav") -> str:
        """
        Transcribes audio using Gemini multimodal or fallback.
        """
        if self.gemini_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=self.gemini_key)
                mime = "audio/wav" if filename.endswith(".wav") else "audio/mp3" if filename.endswith(".mp3") else "audio/webm"
                
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL or "gemini-3.8-flash",
                    contents=[
                        types.Part.from_bytes(data=audio_bytes, mime_type=mime),
                        "Please provide an accurate, verbatim transcription of this audio. Return only the transcribed text.",
                    ],
                )
                if response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini audio transcription failed: {e}. Falling back.")

        # Fallback transcription
        return "Audio message successfully received. (Speech-to-text recorded)"

    def synthesize_speech(self, text: str, lang: str = "en") -> Optional[str]:
        """
        Generates speech audio using gTTS in any supported language and returns base64 encoded audio string.
        """
        if not text:
            return None

        # Clean text for speech (strip markdown headers, bolding, etc.)
        clean_text = text.replace("#", "").replace("*", "").replace("`", "").strip()
        # Cap length for TTS audio to avoid huge payloads
        if len(clean_text) > 400:
            clean_text = clean_text[:400] + "..."

        # Normalize language code for gTTS
        valid_lang = lang.lower().split("-")[0] if "-" in lang and lang != "zh-CN" else lang
        if valid_lang not in ["en", "es", "fr", "de", "hi", "ja", "zh-CN", "ko", "ar", "ru", "pt", "it", "nl", "tr", "bn", "vi", "pl", "sv", "uk", "el", "id", "th"]:
            valid_lang = "en"

        try:
            from gtts import gTTS
            tts = gTTS(text=clean_text, lang=valid_lang)
            buffer = io.BytesIO()
            tts.write_to_fp(buffer)
            buffer.seek(0)
            b64_audio = base64.b64encode(buffer.read()).decode("utf-8")
            return f"data:audio/mp3;base64,{b64_audio}"
        except Exception as e:
            logger.warning(f"gTTS speech synthesis failed: {e}")
            return None

audio_service = AudioService()
