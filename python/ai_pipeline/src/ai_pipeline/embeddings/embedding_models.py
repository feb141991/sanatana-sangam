from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class EmbeddingModelSpec:
    name: str
    dimension: int
    provider: str


class EmbeddingModelRegistry:
    """Registry stub for Phase 1 model selection."""

    def __init__(self) -> None:
        self._models = {
            "indicbert-placeholder": EmbeddingModelSpec(
                name="indicbert-placeholder",
                dimension=768,
                provider="local-placeholder",
            )
        }

    def get(self, model_name: str) -> EmbeddingModelSpec:
        return self._models[model_name]
