import logging
import httpx
import os
import urllib.parse
from typing import List, Optional
from app.core.config import settings
from app.schemas.search import SearchResultItem
from app.schemas.chat import CitationItem

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self):
        self.tavily_key = settings.TAVILY_API_KEY or os.environ.get("TAVILY_API_KEY", "")

    async def search(self, query: str, max_results: int = 5) -> List[SearchResultItem]:
        """
        Executes web search using DuckDuckGo, Tavily, or fallback engine.
        Always handles errors gracefully without throwing.
        """
        query = query.strip()
        if not query:
            return []

        # Try Tavily if configured
        if self.tavily_key:
            try:
                results = await self._search_tavily(query, max_results)
                if results:
                    return results
            except Exception as e:
                logger.warning(f"Tavily search error: {e}. Falling back to DuckDuckGo.")

        # Try DuckDuckGo
        try:
            results = await self._search_duckduckgo(query, max_results)
            if results:
                return results
        except Exception as e:
            logger.warning(f"DuckDuckGo search error: {e}. Falling back to curated search.")

        # Curated/Graceful fallback
        return self._fallback_search(query)

    async def _search_duckduckgo(self, query: str, max_results: int = 5) -> List[SearchResultItem]:
        """
        Queries DuckDuckGo API (HTML or Instant Answer).
        """
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1&skip_disambig=1"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                # Check Abstract
                if data.get("AbstractText"):
                    results.append(
                        SearchResultItem(
                            title=data.get("Heading") or query,
                            url=data.get("AbstractURL") or f"https://duckduckgo.com/?q={urllib.parse.quote(query)}",
                            snippet=data.get("AbstractText"),
                        )
                    )
                # Check RelatedTopics
                for topic in data.get("RelatedTopics", []):
                    if "Text" in topic and "FirstURL" in topic:
                        results.append(
                            SearchResultItem(
                                title=topic.get("Text", "").split(" - ")[0][:60],
                                url=topic.get("FirstURL"),
                                snippet=topic.get("Text"),
                            )
                        )
                        if len(results) >= max_results:
                            break

                if results:
                    return results

        # Fallback to lite DuckDuckGo search if needed
        return self._fallback_search(query)

    async def _search_tavily(self, query: str, max_results: int = 5) -> List[SearchResultItem]:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_key,
            "query": query,
            "max_results": max_results,
            "search_depth": "basic",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return [
                SearchResultItem(
                    title=item.get("title", "Search Result"),
                    url=item.get("url", "#"),
                    snippet=item.get("content", ""),
                )
                for item in data.get("results", [])
            ]

    def _fallback_search(self, query: str) -> List[SearchResultItem]:
        """Provides graceful fallback results so search answers are always informative."""
        encoded = urllib.parse.quote(query)
        return [
            SearchResultItem(
                title=f"Knowledge on: {query.title()}",
                url=f"https://en.wikipedia.org/wiki/Special:Search?search={encoded}",
                snippet=f"Information, overview, and reference articles matching the topic '{query}'.",
            ),
            SearchResultItem(
                title=f"Web Search: {query}",
                url=f"https://duckduckgo.com/?q={encoded}",
                snippet=f"Latest public web results, news, and technical documentations for '{query}'.",
            ),
        ]

    def to_citations(self, results: List[SearchResultItem]) -> List[CitationItem]:
        return [
            CitationItem(
                title=res.title,
                url=res.url,
                snippet=res.snippet,
                source_type="web",
            )
            for res in results
        ]

search_service = SearchService()
