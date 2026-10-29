from fastapi import APIRouter
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import search_service

router = APIRouter()

@router.post("/search", response_model=SearchResponse)
async def search_external_sources(req: SearchRequest):
    results = await search_service.search(query=req.query, max_results=req.max_results or 5)
    return SearchResponse(
        query=req.query,
        results=results,
        summary=f"Found {len(results)} relevant web sources for '{req.query}'." if results else "No direct matches found.",
    )
