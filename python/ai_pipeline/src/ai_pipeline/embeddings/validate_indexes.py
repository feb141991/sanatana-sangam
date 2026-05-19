"""
Pramana Corpus Index Validator

Validates the structure, coverage, and integrity of TF-IDF embedding indexes.
Standardized index output shape:
  {
    "idf": { "<token>": <float>, ... },
    "documents": [
      {
        "id": "<corpus>_<ref>",
        "ref": "<chapter.verse>",
        "chapter": <int>,
        "sanskrit"|"original": "<source text>",
        "transliteration": "<latin script>",
        "text": "<translation>",
        "vector": { "<token>": <float>, ... }
      },
      ...
    ]
  }

Run:  npm run corpus:validate-indexes
"""

import json
import sys
from pathlib import Path


def validate_index(name: str, index_path: Path) -> dict:
    """Validate a single corpus index file and return a summary."""
    result = {
        "name": name,
        "path": str(index_path),
        "exists": index_path.exists(),
        "valid": False,
        "document_count": 0,
        "idf_token_count": 0,
        "avg_vector_size": 0,
        "refs": [],
        "errors": [],
    }

    if not index_path.exists():
        result["errors"].append("Index file does not exist.")
        return result

    try:
        with open(index_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        result["errors"].append(f"JSON parse error: {e}")
        return result

    # Validate top-level shape
    if "idf" not in data:
        result["errors"].append("Missing top-level 'idf' key.")
    if "documents" not in data:
        result["errors"].append("Missing top-level 'documents' key.")
        return result

    idf = data.get("idf", {})
    docs = data.get("documents", [])

    result["idf_token_count"] = len(idf)
    result["document_count"] = len(docs)

    if len(docs) == 0:
        result["errors"].append("Document list is empty.")
        return result

    # Validate each document
    total_vector_size = 0
    for i, doc in enumerate(docs):
        if "id" not in doc:
            result["errors"].append(f"Document [{i}] missing 'id'.")
        if "ref" not in doc:
            result["errors"].append(f"Document [{i}] missing 'ref'.")
        if "vector" not in doc:
            result["errors"].append(f"Document [{i}] missing 'vector'.")
        else:
            total_vector_size += len(doc["vector"])
        result["refs"].append(doc.get("ref", "?"))

    result["avg_vector_size"] = round(total_vector_size / len(docs), 1) if docs else 0

    if not result["errors"]:
        result["valid"] = True

    return result


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    corpus_dir = root / "corpus"

    indexes = [
        ("pathshala_gita", corpus_dir / "gita_index.json"),
        ("pathshala_upanishads", corpus_dir / "upanishads_index.json"),
        ("sikh_gurbani", corpus_dir / "gurbani_index.json"),
    ]

    print("=" * 80)
    print("📋 PRAMANA CORPUS INDEX VALIDATION REPORT")
    print("=" * 80)
    print()

    all_valid = True
    summaries = []

    for name, path in indexes:
        summary = validate_index(name, path)
        summaries.append(summary)

        status = "✅ VALID" if summary["valid"] else "❌ INVALID"
        if not summary["exists"]:
            status = "⚠️ MISSING"

        print(f"📁 Index: {name}")
        print(f"   Status: {status}")
        print(f"   Path: {summary['path']}")
        print(f"   Documents: {summary['document_count']}")
        print(f"   IDF tokens: {summary['idf_token_count']}")
        print(f"   Avg vector size: {summary['avg_vector_size']}")
        if summary["refs"]:
            refs_preview = summary["refs"][:5]
            more = f" ... +{len(summary['refs']) - 5} more" if len(summary["refs"]) > 5 else ""
            print(f"   Refs (sample): {', '.join(refs_preview)}{more}")
        if summary["errors"]:
            for err in summary["errors"]:
                print(f"   ⚠️ {err}")
        print()

        if not summary["valid"]:
            all_valid = False

    print("=" * 80)
    if all_valid:
        print("🎉 All corpus indexes are valid.")
    else:
        print("❌ Some corpus indexes have issues. See details above.")
    print("=" * 80)

    sys.exit(0 if all_valid else 1)


if __name__ == "__main__":
    main()
