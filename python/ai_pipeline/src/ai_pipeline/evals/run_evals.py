from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ai_pipeline.evals.score_grounding import score_grounding
from ai_pipeline.evals.score_translation import score_translation


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def run_eval_suite(dataset_path: Path) -> dict[str, Any]:
    cases = load_jsonl(dataset_path)
    return {
        "dataset": str(dataset_path),
        "case_count": len(cases),
        "scorers": ["score_grounding", "score_translation"],
    }


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    dataset_path = root / "datasets" / "evals" / "pathshala_explain.sample.jsonl"
    summary = run_eval_suite(dataset_path)
    summary["sample_scores"] = {
        "grounding": score_grounding({"sources": [{"doc_id": "placeholder"}]}),
        "translation": score_translation({"answer": "placeholder"}),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
