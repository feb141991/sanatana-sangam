from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ai_pipeline.embeddings.embedding_models import EmbeddingModelRegistry


def build_embedding_record(text: str, model_name: str = "indicbert-placeholder") -> dict[str, Any]:
    registry = EmbeddingModelRegistry()
    spec = registry.get(model_name)
    # Placeholder vector so downstream contracts can be sketched without a model dependency.
    return {
        "model_name": spec.name,
        "dimension": spec.dimension,
        "vector": [0.0] * min(spec.dimension, 8),
        "text_preview": text[:120],
    }


def main() -> None:
    sample = build_embedding_record("sample text")
    print(json.dumps(sample, indent=2))


if __name__ == "__main__":
    main()
