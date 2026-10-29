import logging
import math
import hashlib
import os
import httpx
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generates a vector embedding (dim=768) using Gemini, OpenAI, or a deterministic local vectorizer.
        """
        text = text.strip()
        if not text:
            return [0.0] * 768

        if self.gemini_key:
            try:
                return await self._get_gemini_embedding(text)
            except Exception as e:
                logger.warning(f"Gemini embedding failed: {e}. Using local vectorizer fallback.")

        if self.openai_key:
            try:
                return await self._get_openai_embedding(text)
            except Exception as e:
                logger.warning(f"OpenAI embedding failed: {e}. Using local vectorizer fallback.")

        return self._local_vectorize(text, dim=768)

    async def _get_gemini_embedding(self, text: str) -> List[float]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={self.gemini_key}"
        payload = {
            "model": "models/text-embedding-004",
            "content": {"parts": [{"text": text[:2000]}]},
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            values = data.get("embedding", {}).get("values", [])
            if values:
                return values[:768]
        return self._local_vectorize(text, dim=768)

    async def _get_openai_embedding(self, text: str) -> List[float]:
        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"}
        payload = {
            "model": settings.OPENAI_EMBEDDING_MODEL or "text-embedding-3-small",
            "input": text[:2000],
            "dimensions": 768,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["data"][0]["embedding"]

    def _local_vectorize(self, text: str, dim: int = 768) -> List[float]:
        """
        Deterministic, lightweight token/n-gram hashing vectorizer.
        Produces normalized 768-dim embeddings with high semantic overlap for matching terms.
        """
        vec = [0.0] * dim
        words = text.lower().split()
        if not words:
            return vec

        for word in words:
            # Hash full word
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if (h % 2 == 0) else -1.0
            vec[idx] += sign

            # Also hash character 3-grams for subword similarity
            for i in range(len(word) - 2):
                ngram = word[i:i+3]
                nh = int(hashlib.sha256(ngram.encode("utf-8")).hexdigest(), 16)
                nidx = nh % dim
                nsign = 0.5 if (nh % 2 == 0) else -0.5
                vec[nidx] += nsign

        # L2 Normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

embedding_service = EmbeddingService()
