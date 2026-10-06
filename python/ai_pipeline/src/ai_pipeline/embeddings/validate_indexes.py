"""
Pramana Corpus Index Validator

Validates the structure, coverage, and integrity of the corpus retrieval
indexes. Two index formats are in use and both are validated:

Sparse (TF-IDF) — `<corpus>_index.json`:
  {
    "idf": { "<token>": <float>, ... },
    "documents": [ { "id", "ref", ..., "vector": { "<token>": <float>, ... } } ]
  }

Dense (neural embedding) — `<corpus>_index_dense.json`, built by
build_embeddings.py and served by PramanaDenseEmbeddingRetriever:
  {
    "metadata": { "embedding_model": "...", "embedding_dim": 384, ... },
    "documents": [ { "id", "ref", ..., "vector": [<float> x embedding_dim] } ]
  }

Checks for every index: required keys, non-empty documents, unique document
ids (a duplicate id means two passages share one citation), and per-document
vectors of the right shape. Dense indexes additionally require a consistent
embedding dimension matching metadata, finite values and unit-normalised
vectors (the retriever ranks by cosine on normalised vectors). When a dense
index has a sparse sibling, both must cover exactly the same document ids so
a cutover never silently drops passages.

Run:  PYTHONPATH=python/ai_pipeline/src python3 -m ai_pipeline.embeddings.validate_indexes
"""

import json
import math
import sys
from pathlib import Path

UNIT_NORM_TOLERANCE = 1e-3


def detect_format(data: dict) -> str:
    """Return "dense", "sparse" or "unknown" from the first document's vector."""
    docs = data.get("documents") or []
    first_vector = docs[0].get("vector") if docs and isinstance(docs[0], dict) else None
    if isinstance(first_vector, list):
        return "dense"
    if isinstance(first_vector, dict) or "idf" in data:
        return "sparse"
    return "unknown"


def validate_index(name: str, index_path: Path) -> dict:
    """Validate a single corpus index file and return a summary."""
    result = {
        "name": name,
        "path": str(index_path),
        "exists": index_path.exists(),
        "valid": False,
        "format": "unknown",
        "document_count": 0,
        "idf_token_count": 0,
        "avg_vector_size": 0,
        "embedding_dim": None,
        "duplicate_ids": [],
        "ids": [],
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

    if "documents" not in data:
        result["errors"].append("Missing top-level 'documents' key.")
        return result

    docs = data.get("documents", [])
    metadata = data.get("metadata", {})
    index_format = detect_format(data)
    result["format"] = index_format
    result["document_count"] = len(docs)
    result["manifest_count"] = metadata.get("manifest_count", "Unknown")
    result["scale_readiness"] = metadata.get("scale_readiness", "Unknown")

    if len(docs) == 0:
        result["errors"].append("Document list is empty.")
        return result

    if index_format == "sparse":
        if "idf" not in data:
            result["errors"].append("Missing top-level 'idf' key.")
        result["idf_token_count"] = len(data.get("idf", {}))
    elif index_format == "dense":
        declared_dim = metadata.get("embedding_dim")
        if not isinstance(declared_dim, int) or declared_dim <= 0:
            result["errors"].append("Dense index metadata is missing a positive integer 'embedding_dim'.")
            declared_dim = None
        if not metadata.get("embedding_model"):
            result["errors"].append("Dense index metadata is missing 'embedding_model'.")
        result["embedding_dim"] = declared_dim
    else:
        result["errors"].append("Unrecognised index format: first document has no dict or list 'vector'.")

    declared_count = metadata.get("document_count")
    if isinstance(declared_count, int) and declared_count != len(docs):
        result["errors"].append(f"metadata.document_count is {declared_count} but the index has {len(docs)} documents.")

    seen: dict[str, int] = {}
    total_vector_size = 0
    for i, doc in enumerate(docs):
        if not isinstance(doc, dict):
            result["errors"].append(f"Document [{i}] is not an object.")
            continue
        doc_id = doc.get("id")
        if doc_id is None:
            result["errors"].append(f"Document [{i}] missing 'id'.")
        else:
            seen[doc_id] = seen.get(doc_id, 0) + 1
            result["ids"].append(doc_id)
        if "ref" not in doc:
            result["errors"].append(f"Document [{i}] missing 'ref'.")
        result["refs"].append(doc.get("ref", "?"))

        vector = doc.get("vector")
        if vector is None:
            result["errors"].append(f"Document [{i}] missing 'vector'.")
            continue
        if index_format == "sparse":
            if not isinstance(vector, dict):
                result["errors"].append(f"Document [{i}] ({doc_id}) has a non-sparse vector in a sparse index.")
                continue
            total_vector_size += len(vector)
        elif index_format == "dense":
            if not isinstance(vector, list):
                result["errors"].append(f"Document [{i}] ({doc_id}) has a non-list vector in a dense index.")
                continue
            total_vector_size += len(vector)
            if result["embedding_dim"] is not None and len(vector) != result["embedding_dim"]:
                result["errors"].append(f"Document [{i}] ({doc_id}) vector has {len(vector)} dims, expected {result['embedding_dim']}.")
                continue
            if not all(isinstance(value, (int, float)) and math.isfinite(value) for value in vector):
                result["errors"].append(f"Document [{i}] ({doc_id}) vector contains non-finite or non-numeric values.")
                continue
            norm = math.sqrt(sum(value * value for value in vector))
            if abs(norm - 1.0) > UNIT_NORM_TOLERANCE:
                result["errors"].append(f"Document [{i}] ({doc_id}) vector is not unit-normalised (norm {norm:.4f}).")

    duplicates = sorted(doc_id for doc_id, count in seen.items() if count > 1)
    result["duplicate_ids"] = duplicates
    if duplicates:
        affected = sum(seen[doc_id] for doc_id in duplicates)
        preview = ", ".join(duplicates[:5]) + (f" ... +{len(duplicates) - 5} more" if len(duplicates) > 5 else "")
        result["errors"].append(
            f"{len(duplicates)} document ids are shared by {affected} documents, so distinct passages carry the same citation: {preview}"
        )

    result["avg_vector_size"] = round(total_vector_size / len(docs), 1) if docs else 0
    result["valid"] = not result["errors"]
    return result


def check_parity(sparse: dict, dense: dict) -> list[str]:
    """A dense index must cover exactly the documents of its sparse sibling."""
    if not (sparse["exists"] and dense["exists"]):
        return []
    sparse_ids, dense_ids = set(sparse["ids"]), set(dense["ids"])
    errors = []
    missing = sorted(sparse_ids - dense_ids)
    extra = sorted(dense_ids - sparse_ids)
    if missing:
        errors.append(f"Dense index is missing {len(missing)} ids present in the sparse index (e.g. {', '.join(missing[:3])}).")
    if extra:
        errors.append(f"Dense index has {len(extra)} ids absent from the sparse index (e.g. {', '.join(extra[:3])}).")
    if sparse["document_count"] != dense["document_count"]:
        errors.append(f"Document counts differ: sparse {sparse['document_count']}, dense {dense['document_count']}.")
    return errors


def corpus_indexes(corpus_dir: Path) -> list[tuple[str, Path, Path | None]]:
    """(name, sparse path, dense path or None) for every served corpus index."""
    return [
        ("pathshala_gita", corpus_dir / "gita_index.json", corpus_dir / "gita_index_dense.json"),
        ("pathshala_upanishads", corpus_dir / "upanishads_index.json", corpus_dir / "upanishads_index_dense.json"),
        ("sikh_gurbani", corpus_dir / "gurbani_index.json", None),
        ("buddhist_dhamma", corpus_dir / "buddhist_dhamma_index.json", None),
        ("jain_dharma", corpus_dir / "jain_dharma_index.json", None),
        ("valmiki_ramayana", corpus_dir / "valmiki_ramayana_index.json", None),
        ("dharam_veer_reflection", corpus_dir / "dharam_veer_index.json", None),
    ]


def print_summary(label: str, summary: dict) -> None:
    status = "✅ VALID" if summary["valid"] else "❌ INVALID"
    if not summary["exists"]:
        status = "⚠️ MISSING"
    print(f"📁 Index: {label}")
    print(f"   Status: {status}")
    print(f"   Format: {summary['format']}")
    print(f"   Scale Readiness: {summary.get('scale_readiness', 'Unknown')}")
    print(f"   Path: {summary['path']}")
    print(f"   Manifests: {summary.get('manifest_count', 'Unknown')}")
    print(f"   Documents: {summary['document_count']}")
    if summary["format"] == "dense":
        print(f"   Embedding dim: {summary['embedding_dim']}")
    else:
        print(f"   IDF tokens: {summary['idf_token_count']}")
    print(f"   Avg vector size: {summary['avg_vector_size']}")
    if summary["refs"]:
        refs_preview = summary["refs"][:5]
        more = f" ... +{len(summary['refs']) - 5} more" if len(summary["refs"]) > 5 else ""
        print(f"   Refs (sample): {', '.join(refs_preview)}{more}")
    for err in summary["errors"]:
        print(f"   ⚠️ {err}")
    print()


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    corpus_dir = root / "corpus"

    print("=" * 80)
    print("📋 PRAMANA CORPUS INDEX VALIDATION REPORT")
    print("=" * 80)
    print()

    all_valid = True
    for name, sparse_path, dense_path in corpus_indexes(corpus_dir):
        sparse = validate_index(name, sparse_path)
        print_summary(name, sparse)
        all_valid = all_valid and sparse["valid"]

        if dense_path is not None:
            dense = validate_index(f"{name} (dense)", dense_path)
            parity_errors = check_parity(sparse, dense)
            if parity_errors:
                dense["errors"].extend(parity_errors)
                dense["valid"] = False
            print_summary(f"{name} (dense)", dense)
            all_valid = all_valid and dense["valid"]

    print("=" * 80)
    if all_valid:
        print("🎉 All corpus indexes are valid.")
    else:
        print("❌ Some corpus indexes have issues. See details above.")
    print("=" * 80)

    sys.exit(0 if all_valid else 1)


if __name__ == "__main__":
    main()
