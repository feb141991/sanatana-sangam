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


class InMemorySearchBackend:
    """Non-production placeholder backend used for contract wiring."""

    def search(self, query: str, filters: RetrievalFilters, limit: int = 5) -> list[SearchResult]:
        del query, filters
        return [
            SearchResult(
                chunk_id="placeholder:0001",
                doc_id="placeholder",
                score=0.0,
                text="Replace InMemorySearchBackend with a vector search implementation.",
            )
        ][:limit]
