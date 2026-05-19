from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ai_pipeline.evals.score_grounding import score_grounding
from ai_pipeline.evals.score_translation import score_translation


from ai_pipeline.evals.score_pathshala import score_pathshala_explain


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
    
    # Run a mock evaluation on the cases to demonstrate the scorer
    case_results = []
    for case in cases:
        # Generate a mock response matching the JSON contract
        mock_response = json.dumps({
            "word_by_word": "Mock word analysis.",
            "meaning": "Mock meaning referencing " + case["prompt"]["chunk_id"] + " from Gita.",
            "commentary": "Mock commentary in the spirit of Advaita referencing Sanskrit verse.",
            "daily_application": "Mock daily application.",
            "contemplation": "Mock contemplation question.",
            "related_text": "Echoed in Upanishads."
        }, ensure_ascii=False)
        
        if case["prompt"]["language"] == "hi":
            # Add some Devanagari characters for language compliance check
            mock_response = json.dumps({
                "word_by_word": "शब्द विश्लेषण।",
                "meaning": "गीता से श्लोक का अर्थ: " + case["prompt"]["chunk_id"],
                "commentary": "टिप्पणी।",
                "daily_application": "दैनिक जीवन में उपयोग।",
                "contemplation": "चिंतन।",
                "related_text": "उपनिषद।"
            }, ensure_ascii=False)

        passage_content = "Sanskrit text for Gita verse. Ref: " + case["prompt"]["chunk_id"]
        if case["prompt"]["language"] == "hi":
            passage_content += " श्लोक गीता"

        mock_result = {
            "raw_response": mock_response,
            "retrieved_passages": [
                {
                    "content": passage_content,
                    "metadata": {
                        "sourceName": "Bhagavad Gita",
                        "chunkId": case["prompt"]["chunk_id"]
                    }
                }
            ]
        }
        
        score_info = score_pathshala_explain(mock_result, case)
        case_results.append({
            "case_id": case["case_id"],
            "score_info": score_info
        })

    return {
        "dataset": str(dataset_path),
        "case_count": len(cases),
        "scorers": ["score_grounding", "score_translation", "score_pathshala_explain"],
        "results": case_results
    }


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    dataset_path = root / "datasets" / "evals" / "pathshala_explain.sample.jsonl"
    summary = run_eval_suite(dataset_path)
    summary["sample_scores"] = {
        "grounding": score_grounding({"sources": [{"doc_id": "placeholder"}]}),
        "translation": score_translation({"answer": "placeholder"}),
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
