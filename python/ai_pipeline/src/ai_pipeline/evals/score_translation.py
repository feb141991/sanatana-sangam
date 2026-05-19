from __future__ import annotations

from typing import Any


def score_translation(result: dict[str, Any]) -> dict[str, Any]:
    answer = result.get("answer", "")
    return {
        "has_answer": bool(answer.strip()),
        "character_count": len(answer),
    }
