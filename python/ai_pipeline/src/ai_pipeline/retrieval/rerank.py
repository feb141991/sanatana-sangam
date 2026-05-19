from __future__ import annotations

from ai_pipeline.retrieval.search import SearchResult


def rerank_results(results: list[SearchResult]) -> list[SearchResult]:
    return sorted(results, key=lambda item: item.score, reverse=True)
