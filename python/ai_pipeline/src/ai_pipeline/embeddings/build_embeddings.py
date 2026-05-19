import json
import math
import re
from pathlib import Path
from typing import Any


def tokenize(text: str) -> list[str]:
    text = text.lower()
    return re.findall(r"[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*", text)


def build_gita_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    # 1. Load manifests
    for ch in range(1, 19):
        manifest_path = manifests_dir / f"gita_chapter_{ch}.json"
        if not manifest_path.exists():
            continue
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        for verse in manifest.get("content", []):
            ref = verse.get("ref", "")
            sanskrit = verse.get("sanskrit", "")
            transliteration = verse.get("transliteration", "")
            text = verse.get("text", "")

            # Inject boosted metadata prefix to prioritize reference matches
            ref_words = f"chapter {ref.replace('.', ' verse ')}"
            boosted_metadata = f"{ref_words} {ref} " * 10
            combined_text = f"{boosted_metadata} bhagavad gita {sanskrit} {transliteration} {text}"
            tokens = tokenize(combined_text)

            documents.append({
                "id": f"{manifest.get('doc_id')}_{ref}",
                "ref": ref,
                "chapter": ch,
                "sanskrit": sanskrit,
                "transliteration": transliteration,
                "text": text,
                "tokens": tokens,
            })

    if not documents:
        print("No Gita documents found.")
        return

    # 2. Compute Document Frequencies
    df = {}
    for doc in documents:
        seen = set(doc["tokens"])
        for token in seen:
            df[token] = df.get(token, 0) + 1

    # 3. Compute IDF
    num_docs = len(documents)
    idf = {}
    for token, count in df.items():
        idf[token] = math.log((1 + num_docs) / (1 + count)) + 1

    # 4. Compute TF-IDF Vectors
    indexed_docs = []
    for doc in documents:
        tf = {}
        for token in doc["tokens"]:
            tf[token] = tf.get(token, 0) + 1

        # Compute TF-IDF
        tfidf = {}
        for token, count in tf.items():
            tfidf[token] = count * idf[token]

        # L2 Normalize
        squared_sum = sum(val**2 for val in tfidf.values())
        norm = math.sqrt(squared_sum) if squared_sum > 0 else 1.0

        normalized_tfidf = {token: val / norm for token, val in tfidf.items()}

        indexed_docs.append({
            "id": doc["id"],
            "ref": doc["ref"],
            "chapter": doc["chapter"],
            "sanskrit": doc["sanskrit"],
            "transliteration": doc["transliteration"],
            "text": doc["text"],
            "vector": normalized_tfidf,
        })

    # 5. Save index
    index_data = {
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Gita verses at {output_file}")


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    manifests_dir = root / "corpus" / "manifests"
    output_file = root / "corpus" / "gita_index.json"
    build_gita_index(manifests_dir, output_file)


if __name__ == "__main__":
    main()
