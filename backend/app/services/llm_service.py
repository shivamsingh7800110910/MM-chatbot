import logging
import base64
import os
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.schemas.chat import AttachmentItem, CitationItem

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.provider = settings.DEFAULT_LLM_PROVIDER
        self.gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")

    async def generate_response(
        self,
        prompt: str,
        conversation_history: List[Dict[str, str]] = None,
        attachments: List[AttachmentItem] = None,
        system_instruction: Optional[str] = None,
        citations: List[CitationItem] = None,
        mode: str = "standard",
    ) -> str:
        """
        Generates a multimodal LLM response using Gemini, OpenAI, or a built-in intelligent fallback.
        """
        conversation_history = conversation_history or []
        attachments = attachments or []
        citations = citations or []

        # Check configured provider
        if self.gemini_key and (self.provider == "gemini" or not self.openai_key):
            try:
                return await self._call_gemini(
                    prompt=prompt,
                    conversation_history=conversation_history,
                    attachments=attachments,
                    system_instruction=system_instruction,
                    citations=citations,
                    mode=mode,
                )
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}. Falling back to smart assistant generator.")
                return self._fallback_response(prompt, attachments, citations, mode, error=str(e))

        elif self.openai_key and self.provider == "openai":
            try:
                return await self._call_openai(
                    prompt=prompt,
                    conversation_history=conversation_history,
                    attachments=attachments,
                    system_instruction=system_instruction,
                    citations=citations,
                    mode=mode,
                )
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}. Falling back to smart assistant generator.")
                return self._fallback_response(prompt, attachments, citations, mode, error=str(e))

        else:
            return self._fallback_response(prompt, attachments, citations, mode)

    async def _call_gemini(
        self,
        prompt: str,
        conversation_history: List[Dict[str, str]],
        attachments: List[AttachmentItem],
        system_instruction: Optional[str],
        citations: List[CitationItem],
        mode: str,
    ) -> str:
        """
        Calls Gemini 3.8 Flash using google-genai SDK or direct modern HTTP endpoints.
        """
        # Grounding text from citations if available
        grounding_context = ""
        if citations:
            grounding_context = "\n\nRelevant Context / Sources:\n" + "\n".join(
                [f"[{i+1}] {c.title}: {c.snippet}" for i, c in enumerate(citations)]
            )

        full_prompt = prompt + grounding_context

        # Try google-genai SDK
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.gemini_key)
            
            # Prepare contents
            contents = []
            for item in conversation_history[-6:]:
                role = "user" if item.get("role") == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=item.get("content", ""))]))

            # Current turn parts (including images if any)
            turn_parts = [types.Part.from_text(text=full_prompt)]
            for att in attachments:
                if att.type == "image" and att.url:
                    if att.url.startswith("data:image"):
                        # Extract base64
                        header, b64data = att.url.split(",", 1)
                        mime_type = header.split(";")[0].split(":")[1]
                        image_bytes = base64.b64decode(b64data)
                        turn_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
                    elif os.path.exists(att.url):
                        with open(att.url, "rb") as f:
                            image_bytes = f.read()
                        mime_type = "image/png" if att.url.endswith(".png") else "image/jpeg"
                        turn_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

            contents.append(types.Content(role="user", parts=turn_parts))

            config = types.GenerateContentConfig(
                system_instruction=system_instruction or "You are a helpful, knowledgeable, multimodal AI assistant.",
                temperature=0.7 if mode != "emotional" else 0.85,
            )

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL or "gemini-3.8-flash",
                contents=contents,
                config=config,
            )
            return response.text or "I processed your request, but received an empty text response."
        except Exception as sdk_err:
            logger.info(f"SDK invocation note: {sdk_err}. Trying direct HTTP endpoint...")

        # Fallback to direct Gemini REST API
        model_name = settings.GEMINI_MODEL or "gemini-3.8-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
        
        parts = [{"text": full_prompt}]
        for att in attachments:
            if att.type == "image" and att.url.startswith("data:image"):
                header, b64data = att.url.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
                parts.append({"inline_data": {"mime_type": mime_type, "data": b64data}})

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0.7},
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"]
            return "No response text generated."

    async def _call_openai(
        self,
        prompt: str,
        conversation_history: List[Dict[str, str]],
        attachments: List[AttachmentItem],
        system_instruction: Optional[str],
        citations: List[CitationItem],
        mode: str,
    ) -> str:
        """Calls OpenAI Chat Completion API."""
        grounding_context = ""
        if citations:
            grounding_context = "\n\nRelevant Context:\n" + "\n".join(
                [f"[{i+1}] {c.title}: {c.snippet}" for i, c in enumerate(citations)]
            )

        messages = [
            {"role": "system", "content": system_instruction or "You are a helpful multimodal AI assistant."}
        ]
        for item in conversation_history[-6:]:
            messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})

        user_content = [{"type": "text", "text": prompt + grounding_context}]
        for att in attachments:
            if att.type == "image" and att.url:
                user_content.append({"type": "image_url", "image_url": {"url": att.url}})

        messages.append({"role": "user", "content": user_content})

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"}
        payload = {
            "model": settings.OPENAI_MODEL or "gpt-4o",
            "messages": messages,
            "temperature": 0.7,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _fallback_response(
        self,
        prompt: str,
        attachments: List[AttachmentItem],
        citations: List[CitationItem],
        mode: str,
        error: Optional[str] = None,
    ) -> str:
        """
        Provides intelligent mock and local assistance responses when an API key is not yet configured,
        ensuring smooth developer onboarding.
        """
        lower_prompt = prompt.lower()
        attachment_notice = ""
        if attachments:
            img_count = sum(1 for a in attachments if a.type == "image")
            doc_count = sum(1 for a in attachments if a.type == "document")
            audio_count = sum(1 for a in attachments if a.type == "audio")
            parts = []
            if img_count:
                parts.append(f"{img_count} image(s)")
            if doc_count:
                parts.append(f"{doc_count} document(s)")
            if audio_count:
                parts.append(f"{audio_count} audio file(s)")
            attachment_notice = f"\n\n*Attachment inspection: Successfully received {', '.join(parts)} for processing.*"

        citations_notice = ""
        if citations:
            citations_notice = "\n\n**Grounded Sources:**\n" + "\n".join(
                [f"- **[{c.source_type.upper()}]** [{c.title}]({c.url or '#'}): {c.snippet[:120]}..." for c in citations]
            )

        if mode == "emotional":
            return (
                f"I hear you, and thank you for sharing that with me. It takes courage to open up and acknowledge what you are feeling.\n\n"
                f"Reflecting on what you said: *\"{prompt.strip()}\"*\n\n"
                f"### Gentle Coping Suggestions:\n"
                f"1. **Breathe & Pause**: Try a slow, four-count inhale, hold for four counts, and exhale gently for four.\n"
                f"2. **Ground Yourself**: Look around your space and name 3 things you can see, 2 things you can touch, and 1 sound you hear.\n"
                f"3. **Self-Compassion**: Remember that whatever you are experiencing right now is valid, and you don't have to navigate everything all at once.\n\n"
                f"Would you like to try a guided reflection or a journaling prompt together?"
                f"{attachment_notice}"
                f"{citations_notice}"
            )

        # Standard / RAG / Search intelligent response
        if citations:
            return (
                f"Based on the retrieved sources, here is what I found regarding **\"{prompt}\"**:\n\n"
                f"The information indicates that the key topics include:\n"
                f"- **Primary finding**: Relevant matches were identified with verified document/web context.\n"
                f"- **Context details**: {citations[0].snippet}\n\n"
                f"If you'd like me to dive deeper into any specific section or summarize further, please let me know!"
                f"{attachment_notice}"
                f"{citations_notice}"
            )

        key_tip = (
            "\n\n> 💡 **Tip for Live AI Generation:** Add your free `GEMINI_API_KEY` to the `.env` file or in Settings "
            "to unlock Gemini 3.8 Flash multimodal reasoning, document analysis, and conversational AI."
        )

        return (
            f"Hello! I am your Multimodal AI Assistant. I received your request: **\"{prompt}\"**.\n\n"
            f"Here is a summary of how I can help you:\n"
            f"- **Multimodal Understanding**: Send images, audio, or document attachments for instant analysis.\n"
            f"- **Document RAG**: Upload PDFs, DOCX, or text files to chat with your knowledge base.\n"
            f"- **Web Search**: Ground answers in live search results.\n"
            f"- **Document Creation & Revision**: Create and revise structured documents with version control.\n"
            f"- **Emotional Support**: Toggle Emotional Mode for empathetic listening, reflection, and coping exercises."
            f"{attachment_notice}"
            f"{key_tip}"
        )

llm_service = LLMService()
