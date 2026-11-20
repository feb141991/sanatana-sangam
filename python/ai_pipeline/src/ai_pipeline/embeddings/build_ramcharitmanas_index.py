import json
import math
import sys
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*", text.lower())

def build_ramcharitmanas_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    manifests = sorted(manifests_dir.glob("tulsidas_ramcharitmanas_*.json"))
    manifest_count = 0
    for manifest_path in manifests:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        if not manifest.get("is_pramana_grade", False) or manifest.get("review_status") != "source_audit_approved":
            continue
        manifest_count += 1
        doc_id = manifest.get("doc_id", manifest_path.stem)

        for verse in manifest.get("content", []):
            ref = verse.get("ref", "")
            sanskrit = verse.get("sanskrit", "")
            transliteration = verse.get("transliteration", "")
            text = verse.get("text", "") or verse.get("translation", "")
            kanda = verse.get("kanda", "")
            doha = verse.get("doha", "")

            # Reference boost metadata
            ref_words = f"ramcharitmanas tulsidas {kanda} kanda doha {ref.replace('.', ' chaupai ')}"
            boosted_metadata = f"{ref_words} {ref} " * 10
            combined_text = f"{boosted_metadata} ramcharitmanas tulsidas {sanskrit} {transliteration} {text}"
            tokens = tokenize(combined_text)

            documents.append({
                "id": f"{doc_id}_{ref}",
                "ref": ref,
                "sanskrit": sanskrit,
                "transliteration": transliteration,
                "text": text,
                "kanda": kanda,
                "doha": doha,
                "tokens": tokens,
            })

    if not documents:
        print("No Ramcharitmanas documents found.")
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
            "doha": doc["doha"],
            "sanskrit": doc["sanskrit"],
            "transliteration": doc["transliteration"],
            "text": doc["text"],
            "vector": normalized_tfidf,
        })

    index_data = {
        "metadata": {
            "manifest_count": manifest_count,
            "document_count": len(documents),
            "scale_readiness": "Production-scale" if len(documents) > 50 else "Sample-scale",
            "is_live_in_app": True,
            "activation_status": "active",
            "source_class": "translation",
            "rights_status": "public_domain",
            "review_status": "source_audit_approved"
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Ramcharitmanas passages at {output_file}")

if __name__ == "__main__":
    root = Path(__file__).resolve().parents[5]
    manifests_dir = root / "python/ai_pipeline/corpus/manifests"
    output_file = root / "python/ai_pipeline/corpus/tulsidas_ramcharitmanas_index.json"
    build_ramcharitmanas_index(manifests_dir, output_file)
