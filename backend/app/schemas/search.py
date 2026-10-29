from typing import List, Optional
from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5

class SearchResultItem(BaseModel):
    title: str
    url: str
    snippet: str

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem] = []
    summary: Optional[str] = None
