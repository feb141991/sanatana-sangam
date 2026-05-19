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


import json
import math
import re
from pathlib import Path
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


class GitaEmbeddingSearchBackend:
    def __init__(self, index_path: Path | None = None) -> None:
        if index_path is None:
            # Resolve relative to this file
            root = Path(__file__).resolve().parents[4]
            self.index_path = root / "python" / "ai_pipeline" / "corpus" / "gita_index.json"
        else:
            self.index_path = index_path
        self.index_data = None

    def _load_index(self) -> dict | None:
        if self.index_data is not None:
            return self.index_data
        if not self.index_path.exists():
            return None
        with open(self.index_path, "r", encoding="utf-8") as f:
            self.index_data = json.load(f)
        return self.index_data

    def search(self, query: str, filters: RetrievalFilters, limit: int = 5) -> list[SearchResult]:
        index = self._load_index()
        if not index:
            return []

        tokens = re.findall(r"[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*", query.lower())
        if not tokens:
            return []

        # Build query TF-IDF vector
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1

        query_vector = {}
        sum_sq = 0.0
        for t, count in tf.items():
            idf = index["idf"].get(t, 0.0)
            if idf > 0:
                tfidf = count * idf
                query_vector[t] = tfidf
                sum_sq += tfidf ** 2

        query_norm = math.sqrt(sum_sq)
        if query_norm == 0.0:
            return []

        query_unit_vector = {t: val / query_norm for t, val in query_vector.items()}

        results = []
        for doc in index["documents"]:
            score = 0.0
            doc_vec = doc["vector"]
            for t, val in query_unit_vector.items():
                if t in doc_vec:
                    score += val * doc_vec[t]

            if score > 0.0:
                # doc["id"] is like gita_chapter_1_1.1
                doc_id = doc["id"].rsplit("_", 1)[0]
                results.append(
                    SearchResult(
                        chunk_id=doc["ref"],
                        doc_id=doc_id,
                        score=score,
                        text=f"Sanskrit: {doc.get('sanskrit','')}\nTranslation: {doc.get('text','')}"
                    )
                )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]


class InMemorySearchBackend:
    """Non-production placeholder backend used for contract wiring."""

    def search(self, query: str, filters: RetrievalFilters, limit: int = 5) -> list[SearchResult]:
        backend = GitaEmbeddingSearchBackend()
        results = backend.search(query, filters, limit)
        if results:
            return results
        return [
            SearchResult(
                chunk_id="placeholder:0001",
                doc_id="placeholder",
                score=0.0,
                text="Replace InMemorySearchBackend with a vector search implementation.",
            )
        ][:limit]
