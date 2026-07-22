import json
import math
import re
from pathlib import Path


def tokenize(text: str) -> list[str]:
    return [t for t in re.split(r'[^a-z0-9ऀ-ॿ]+', text.lower()) if t]


def build_dharam_veer_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    manifest_count = 0
    for manifest_path in sorted(manifests_dir.glob("dharam_veer_*.json")):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        manifest_count += 1
        doc_id = manifest.get("doc_id", manifest_path.stem)
        manifest_source_name = manifest.get("source_name", "Dharam Veer")
        manifest_rights = manifest.get("rights_status", "restricted_or_pending")
        manifest_source_class = manifest.get("source_class", "narrative")
        tradition = manifest.get("tradition", "Dharmic")

        for item in manifest.get("content", []):
            ref = item.get("ref", "")
            text = item.get("text", "")
            chunk_type = item.get("chunk_type", "")
            # boost figure-name + chunk-type tokens so exact-figure queries score well even
            # without an exact doc_id title match
            boosted = f"{doc_id.replace('dharam_veer_', '').replace('-', ' ').replace('_', ' ')} {chunk_type} " * 5
            tokens = tokenize(f"{boosted} {text}")

            documents.append({
                "id": f"{doc_id}_{ref}",
                "doc_id": doc_id,
                "ref": ref,
                "text": text,
                "tradition": item.get("tradition", tradition),
                "source_name": item.get("source_name", manifest_source_name),
                "source_class": item.get("source_class", manifest_source_class),
                "rights_status": item.get("rights_status", manifest_rights),
                "tokens": tokens,
            })

    if not documents:
        print("No Dharam Veer documents found.")
        return

    df: dict[str, int] = {}
    for doc in documents:
        for token in sorted(set(doc["tokens"])):
            df[token] = df.get(token, 0) + 1

    num_docs = len(documents)
    idf = {token: math.log((1 + num_docs) / (1 + count)) + 1 for token, count in sorted(df.items())}

    indexed_docs = []
    for doc in documents:
        tf: dict[str, int] = {}
        for token in doc["tokens"]:
            tf[token] = tf.get(token, 0) + 1

        tfidf = {token: count * idf[token] for token, count in sorted(tf.items())}
        squared_sum = sum(val ** 2 for val in tfidf.values())
        norm = math.sqrt(squared_sum) if squared_sum > 0 else 1.0
        normalized_tfidf = {token: val / norm for token, val in sorted(tfidf.items())}

        indexed_docs.append({
            "id": doc["id"],
            "doc_id": doc["doc_id"],
            "ref": doc["ref"],
            "text": doc["text"],
            "tradition": doc["tradition"],
            "source_name": doc["source_name"],
            "source_class": doc["source_class"],
            "rights_status": doc["rights_status"],
            "vector": normalized_tfidf,
        })

    index_data = {
        "metadata": {
            "manifest_count": manifest_count,
            "document_count": len(documents),
            "heroes": sorted({doc["doc_id"] for doc in documents}),
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Dharam Veer chunks "
          f"across {manifest_count} heroes at {output_file}")


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[5]
    manifests_dir = root / "python/ai_pipeline/corpus/manifests/dharam_veer"
    output_file = root / "python/ai_pipeline/corpus/dharam_veer_index.json"
    build_dharam_veer_index(manifests_dir, output_file)
