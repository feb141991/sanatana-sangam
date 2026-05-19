from __future__ import annotations

import argparse
import json
from dataclasses import asdict

from ai_pipeline.chunking.chunk_utils import ChunkRecord, build_chunk_id
from ai_pipeline.corpus.normalize import load_manifest, normalize_text


def chunk_manifest(manifest_path: str) -> list[ChunkRecord]:
    manifest = load_manifest(manifest_path)
    chunks: list[ChunkRecord] = []

    for chunk_order, segment in enumerate(manifest.content, start=1):
        normalized = normalize_text(segment.text)
        chunks.append(
            ChunkRecord(
                chunk_id=build_chunk_id(manifest.doc_id, chunk_order),
                doc_id=manifest.doc_id,
                chunk_text=segment.text,
                normalized_text=normalized,
                chunk_order=chunk_order,
                start_ref=segment.ref,
                end_ref=segment.ref,
                tradition=manifest.tradition,
                scripture_family=manifest.scripture_family,
                section_id=manifest.section_id,
                source_class=manifest.source_class,
                rights_status=manifest.rights_status,
                language=manifest.language,
                script=manifest.script,
                tags=[],
                embedding_model="pending",
                embedding_version="v0",
            )
        )

    return chunks


def main() -> None:
    parser = argparse.ArgumentParser(description="Chunk a scripture manifest into records.")
    parser.add_argument("manifest_path", help="Path to a document manifest JSON file.")
    args = parser.parse_args()

    chunks = [asdict(chunk) for chunk in chunk_manifest(args.manifest_path)]
    print(json.dumps(chunks, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
