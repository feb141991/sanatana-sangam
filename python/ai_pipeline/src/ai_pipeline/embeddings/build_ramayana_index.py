import json
import math
import sys
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    # Must match build_embeddings.py's tokenizer (used by every other corpus)
    # and retrieval.ts's runtime query tokenizer exactly. The previous
    # split-on-non-alphanumeric version dropped periods, so a reference like
    # "1.1.1" tokenized to three bare "1"s instead of one "1.1.1" token --
    # the query-side token (built with the period-preserving pattern) then
    # matched nothing in this index's idf table, so exact-reference queries
    # contributed no score at all. Confirmed via
    # scripts/compare_valmiki_ramayana_retrieval.ts, which returned 1.1.6
    # instead of the requested 1.1.1.
    return re.findall(r"[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*", text.lower())

def build_ramayana_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    manifests = sorted(manifests_dir.glob("valmiki_ramayana_*.json"))
    manifest_count = 0
    for manifest_path in manifests:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        manifest_count += 1
        doc_id = manifest.get("doc_id", manifest_path.stem)

        for verse in manifest.get("content", []):
            ref = verse.get("ref", "")
            sanskrit = verse.get("sanskrit", "")
            transliteration = verse.get("transliteration", "")
            text = verse.get("translation", "")
            kanda = verse.get("kanda", "")

            ref_parts = ref.split(".")
            # No character-name stuffing (rama/sita/hanuman) here, matching the
            # convention every other corpus's build script uses: the boost is
            # reference-identity only, so verses are differentiated by their own
            # actual content, not diluted toward whichever names are hardcoded.
            ref_words = f"ramayana {kanda} kanda sarga {ref.replace('.', ' shloka ')}"
            boosted_metadata = f"{ref_words} {ref} " * 10
            combined_text = f"{boosted_metadata} ramayana {sanskrit} {transliteration} {text}"
            tokens = tokenize(combined_text)

            documents.append({
                "id": f"{doc_id}_{ref}",
                "ref": ref,
                "sanskrit": sanskrit,
                "transliteration": transliteration,
                "text": text,
                "kanda": kanda,
                "sarga": verse.get("sarga"),
                "shloka": verse.get("shloka"),
                "tokens": tokens,
            })

    if not documents:
        print("No Ramayana documents found.")
        return

    df = {}
    for doc in documents:
        seen = set(doc["tokens"])
        for token in seen:
            df[token] = df.get(token, 0) + 1

    num_docs = len(documents)
    idf = {}
    for token, count in df.items():
        idf[token] = math.log((1 + num_docs) / (1 + count)) + 1

    indexed_docs = []
    for doc in documents:
        tf = {}
        for token in doc["tokens"]:
            tf[token] = tf.get(token, 0) + 1

        tfidf = {}
        for token, count in tf.items():
            tfidf[token] = count * idf[token]

        squared_sum = sum(val**2 for val in tfidf.values())
        norm = math.sqrt(squared_sum) if squared_sum > 0 else 1.0

        normalized_tfidf = {token: val / norm for token, val in tfidf.items()}

        indexed_docs.append({
            "id": doc["id"],
            "ref": doc["ref"],
            "kanda": doc["kanda"],
            "sarga": doc["sarga"],
            "shloka": doc["shloka"],
            "sanskrit": doc["sanskrit"],
            "transliteration": doc["transliteration"],
            "text": doc["text"],
            "vector": normalized_tfidf,
        })

    index_data = {
        "metadata": {
            "manifest_count": manifest_count,
            "document_count": len(documents),
            "scale_readiness": "Production-scale" if len(documents) > 100 else "Sample-scale",
            "is_live_in_app": True,
            # Governance fields (explicit_only routing gate, plus the
            # rights/review status compare_valmiki_ramayana_retrieval.ts and
            # chat-grounding.ts's source-audit-pending labeling depend on) --
            # keep in sync with docs/RAMAYANA_CANONICAL_SOURCE_PLAN.md. Written
            # here so regenerating the index can never silently drop them again.
            "activation_status": "explicit_only",
            "source_class": "curated_lesson",
            "rights_status": "restricted_or_pending",
            "review_status": "needs_source_audit"
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Ramayana passages at {output_file}")

if __name__ == "__main__":
    root = Path(__file__).resolve().parents[5]
    manifests_dir = root / "python/ai_pipeline/corpus/manifests"
    output_file = root / "python/ai_pipeline/corpus/valmiki_ramayana_index.json"
    build_ramayana_index(manifests_dir, output_file)
