import re
import logging
from typing import Dict, Any, List, Optional
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = [
    {"code": "en", "name": "English", "native": "English", "flag": "🇬🇧", "speech_code": "en"},
    {"code": "es", "name": "Spanish", "native": "Español", "flag": "🇪🇸", "speech_code": "es"},
    {"code": "fr", "name": "French", "native": "Français", "flag": "🇫🇷", "speech_code": "fr"},
    {"code": "de", "name": "German", "native": "Deutsch", "flag": "🇩🇪", "speech_code": "de"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳", "speech_code": "hi"},
    {"code": "ja", "name": "Japanese", "native": "日本語", "flag": "🇯🇵", "speech_code": "ja"},
    {"code": "zh", "name": "Chinese (Simplified)", "native": "简体中文", "flag": "🇨🇳", "speech_code": "zh-CN"},
    {"code": "ko", "name": "Korean", "native": "한국어", "flag": "🇰🇷", "speech_code": "ko"},
    {"code": "ar", "name": "Arabic", "native": "العربية", "flag": "🇸🇦", "speech_code": "ar"},
    {"code": "ru", "name": "Russian", "native": "Русский", "flag": "🇷🇺", "speech_code": "ru"},
    {"code": "pt", "name": "Portuguese", "native": "Português", "flag": "🇧🇷", "speech_code": "pt"},
    {"code": "it", "name": "Italian", "native": "Italiano", "flag": "🇮🇹", "speech_code": "it"},
    {"code": "nl", "name": "Dutch", "native": "Nederlands", "flag": "🇳🇱", "speech_code": "nl"},
    {"code": "tr", "name": "Turkish", "native": "Türkçe", "flag": "🇹🇷", "speech_code": "tr"},
    {"code": "bn", "name": "Bengali", "native": "বাংলা", "flag": "🇧🇩", "speech_code": "bn"},
    {"code": "vi", "name": "Vietnamese", "native": "Tiếng Việt", "flag": "🇻🇳", "speech_code": "vi"},
    {"code": "pl", "name": "Polish", "native": "Polski", "flag": "🇵🇱", "speech_code": "pl"},
    {"code": "sv", "name": "Swedish", "native": "Svenska", "flag": "🇸🇪", "speech_code": "sv"},
    {"code": "uk", "name": "Ukrainian", "native": "Українська", "flag": "🇺🇦", "speech_code": "uk"},
    {"code": "el", "name": "Greek", "native": "Ελληνικά", "flag": "🇬🇷", "speech_code": "el"},
    {"code": "id", "name": "Indonesian", "native": "Bahasa Indonesia", "flag": "🇮🇩", "speech_code": "id"},
    {"code": "th", "name": "Thai", "native": "ไทย", "flag": "🇹🇭", "speech_code": "th"},
]

class LanguageService:
    def get_supported_languages(self) -> List[Dict[str, str]]:
        return SUPPORTED_LANGUAGES

    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Fast heuristic script and pattern-based language detector.
        """
        sample = text.strip()
        if not sample:
            return {"code": "en", "name": "English", "confidence": 1.0, "script": "Latin"}

        # Script detection
        if re.search(r"[\u0900-\u097F]", sample):
            return {"code": "hi", "name": "Hindi", "confidence": 0.98, "script": "Devanagari"}
        if re.search(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]", sample):
            # Check Hiragana/Katakana for Japanese
            if re.search(r"[\u3040-\u309F\u30A0-\u30FF]", sample):
                return {"code": "ja", "name": "Japanese", "confidence": 0.98, "script": "Japanese (Kana/Kanji)"}
            return {"code": "zh", "name": "Chinese", "confidence": 0.95, "script": "Hanzi"}
        if re.search(r"[\uac00-\ud7af]", sample):
            return {"code": "ko", "name": "Korean", "confidence": 0.99, "script": "Hangul"}
        if re.search(r"[\u0600-\u06FF]", sample):
            return {"code": "ar", "name": "Arabic", "confidence": 0.98, "script": "Arabic"}
        if re.search(r"[\u0400-\u04FF]", sample):
            return {"code": "ru", "name": "Russian", "confidence": 0.95, "script": "Cyrillic"}
        if re.search(r"[\u0980-\u09FF]", sample):
            return {"code": "bn", "name": "Bengali", "confidence": 0.98, "script": "Bengali"}
        if re.search(r"[\u0E00-\u0E7F]", sample):
            return {"code": "th", "name": "Thai", "confidence": 0.98, "script": "Thai"}

        # Latin-based common markers
        lower = sample.lower()
        if any(w in lower.split() for w in ["el", "la", "los", "las", "es", "que", "por", "para", "está", "gracias"]):
            return {"code": "es", "name": "Spanish", "confidence": 0.90, "script": "Latin"}
        if any(w in lower.split() for w in ["le", "la", "les", "des", "est", "une", "avec", "pour", "merci"]):
            return {"code": "fr", "name": "French", "confidence": 0.90, "script": "Latin"}
        if any(w in lower.split() for w in ["der", "die", "das", "und", "ist", "nicht", "mit", "danke"]):
            return {"code": "de", "name": "German", "confidence": 0.90, "script": "Latin"}

        return {"code": "en", "name": "English", "confidence": 0.85, "script": "Latin"}

    async def translate_text(self, text: str, target_lang: str, source_lang: Optional[str] = "auto") -> Dict[str, Any]:
        """
        Translates text into target_lang using LLM intelligence with phonetic guide where relevant.
        """
        target_info = next((l for l in SUPPORTED_LANGUAGES if l["code"] == target_lang or l["name"].lower() == target_lang.lower()), None)
        target_name = target_info["name"] if target_info else target_lang

        detected = self.detect_language(text)

        system_instruction = (
            f"You are a master polyglot translator. Translate the provided text accurately and naturally into {target_name}. "
            "Maintain the tone, nuance, and meaning. "
            "If the target language uses a non-Latin script, include a clear phonetic pronunciation/romanization guide. "
            "Output format:\n"
            "Translation: <translated text>\n"
            "Pronunciation: <phonetic pronunciation if non-latin, else None>\n"
            "Notes: <optional nuance note>"
        )
        prompt = f"Translate the following text to {target_name}:\n\"\"\"\n{text}\n\"\"\""

        raw_response = await llm_service.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            mode="standard",
        )

        translated_text = raw_response
        pronunciation = None

        if "Translation:" in raw_response:
            parts = raw_response.split("Translation:")
            content_after = parts[1]
            if "Pronunciation:" in content_after:
                t_part, p_part = content_after.split("Pronunciation:", 1)
                translated_text = t_part.strip()
                if "Notes:" in p_part:
                    pronunciation = p_part.split("Notes:")[0].strip()
                else:
                    pronunciation = p_part.strip()
            else:
                translated_text = content_after.strip()

        return {
            "original_text": text,
            "translated_text": translated_text or raw_response,
            "target_language": target_name,
            "target_code": target_lang,
            "source_language": detected["name"],
            "pronunciation": pronunciation if pronunciation and pronunciation.lower() != "none" else None,
        }

    async def explain_language(self, phrase: str, target_lang: str, level: str = "intermediate") -> Dict[str, Any]:
        """
        Provides detailed educational linguistic breakdown: vocabulary, grammatical patterns, cultural nuance.
        """
        system_instruction = (
            "You are an expert language tutor and linguistic scholar. "
            "Provide a comprehensive, pedagogical breakdown of the provided text. "
            "Explain: 1) Literal vs natural meaning, 2) Key vocabulary breakdown with parts of speech, "
            "3) Grammatical structures (tenses, particles, word order), 4) Cultural usage context, "
            "and 5) CEFR level (A1 to C2)."
        )
        prompt = f"Provide a complete language learning breakdown for this phrase:\n\"{phrase}\" (Target language context: {target_lang}, Learner level: {level})"

        explanation = await llm_service.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            mode="standard",
        )

        detected = self.detect_language(phrase)
        return {
            "phrase": phrase,
            "detected_language": detected["name"],
            "target_language": target_lang,
            "learner_level": level,
            "explanation": explanation,
        }

    async def analyze_tone_and_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyzes emotional sentiment, stylistic tone, reading level, and communicative intent.
        """
        system_instruction = (
            "You are an expert natural language sentiment and tone analyst. "
            "Analyze the given text and return an insightful assessment covering: "
            "1. Primary Sentiment (Positive, Neutral, Negative, or Mixed) "
            "2. Dominant Tones (e.g. Formal, Empathetic, Enthusiastic, Urgent, Analytical, Playful) "
            "3. Key Emotions expressed "
            "4. Constructive feedback or communication suggestions."
        )
        prompt = f"Analyze the tone, sentiment, and emotional undercurrents of this text:\n\"\"\"\n{text}\n\"\"\""

        analysis = await llm_service.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            mode="standard",
        )

        detected = self.detect_language(text)
        return {
            "text": text,
            "language": detected["name"],
            "analysis": analysis,
        }

language_service = LanguageService()
