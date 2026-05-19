from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ai_pipeline.evals.score_grounding import score_grounding
from ai_pipeline.evals.score_translation import score_translation


from ai_pipeline.evals.score_pathshala import score_pathshala_explain
from ai_pipeline.evals.score_katha import score_katha_explain


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def run_gita_eval_suite(dataset_path: Path) -> dict[str, Any]:
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
                "commentary": "टिप्पणी। भगवान कृष्ण अर्जुन को निष्काम कर्म सिखाते हैं।",
                "daily_application": "दैनिक जीवन में उपयोग। फल की चिंता किए बिना कर्तव्य करें।",
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
        "dataset": str(dataset_path.name),
        "case_count": len(cases),
        "scorer": "score_pathshala_explain",
        "results": case_results
    }


def run_katha_eval_suite(dataset_path: Path) -> dict[str, Any]:
    cases = load_jsonl(dataset_path)
    
    case_results = []
    for case in cases:
        story_title = case["prompt"]["chunk_id"]
        story_text = case["prompt"]["story"]
        lang = case["prompt"]["language"]

        # Generate mock response matching katha criteria
        if lang == "hi":
            mock_response = json.dumps({
                "word_by_word": "शब्द विश्लेषण।",
                "meaning": f"कथा {story_title} का अर्थ और सारांश।",
                "commentary": "टिप्पणी। भगवान नरसिंह ने प्रहलाद की रक्षा की और सुदामा पर कृपा की।",
                "daily_application": "दैनिक जीवन में उपयोग। पूर्ण विश्वास और समर्पण रखें।",
                "contemplation": "चिंतन प्रश्न।",
                "related_text": "श्रीमद्भागवत।"
            }, ensure_ascii=False)
        else:
            mock_response = json.dumps({
                "word_by_word": "Key words of the devotional story.",
                "meaning": f"Synopsis of the devotional story of {story_title} who was a devotee.",
                "commentary": f"Commentary on the story of {story_title} demonstrating supreme devotion of Prahlada or Sudama.",
                "daily_application": "How to apply the lesson of surrender to Lord Krishna/Vishnu in everyday life.",
                "contemplation": "Do we have deep devotion?",
                "related_text": "Srimad Bhagavatam"
            }, ensure_ascii=False)

        mock_result = {
            "raw_response": mock_response,
            "retrieved_passages": [
                {
                    "content": f"Story content for {story_title}. {story_text}",
                    "metadata": {
                        "sourceName": "Srimad Bhagavatam",
                        "chunkId": case["prompt"]["chunk_id"]
                    }
                }
            ]
        }

        score_info = score_katha_explain(mock_result, case)
        case_results.append({
            "case_id": case["case_id"],
            "score_info": score_info
        })

    return {
        "dataset": str(dataset_path.name),
        "case_count": len(cases),
        "scorer": "score_katha_explain",
        "results": case_results
    }


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    gita_dataset = root / "datasets" / "evals" / "pathshala_explain.sample.jsonl"
    katha_dataset = root / "datasets" / "evals" / "bhakti_katha.sample.jsonl"

    gita_summary = run_gita_eval_suite(gita_dataset)
    katha_summary = run_katha_eval_suite(katha_dataset)

    output = {
        "pathshala_gita": gita_summary,
        "bhakti_katha": katha_summary,
        "global_scorers": {
            "grounding": score_grounding({"sources": [{"doc_id": "placeholder"}]}),
            "translation": score_translation({"answer": "placeholder"}),
        }
    }
    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
