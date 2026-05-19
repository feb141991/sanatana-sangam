from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class ChunkRecord:
    chunk_id: str
    doc_id: str
    chunk_text: str
    normalized_text: str
    chunk_order: int
    start_ref: str
    end_ref: str
    tradition: str
    scripture_family: str
    section_id: str
    source_class: str
    rights_status: str
    language: str
    script: str
    tags: list[str]
    embedding_model: str
    embedding_version: str


def build_chunk_id(doc_id: str, chunk_order: int) -> str:
    return f"{doc_id}:{chunk_order:04d}"
