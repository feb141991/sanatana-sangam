from __future__ import annotations

from typing import Any


def score_grounding(result: dict[str, Any]) -> dict[str, Any]:
    sources = result.get("sources") or []
    return {
        "grounded": bool(sources),
        "source_count": len(sources),
    }
