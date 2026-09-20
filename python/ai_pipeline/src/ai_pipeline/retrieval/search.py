from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from ai_pipeline.retrieval.filters import RetrievalFilters


@dataclass(slots=True)
class SearchResult:
    chunk_id: str
    doc_id: str
    score: float
    text: str


class SearchBackend(Protocol):
    def search(self, query: str, filters: RetrievalFilters, limit: int = 5) -> list[SearchResult]:
        ...
