from __future__ import annotations

import json
from pathlib import Path

from ai_pipeline.corpus.schemas import DocumentManifest


def load_manifest(path: str | Path) -> DocumentManifest:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    return DocumentManifest.from_dict(payload)


def normalize_text(text: str) -> str:
    return " ".join(text.split())
