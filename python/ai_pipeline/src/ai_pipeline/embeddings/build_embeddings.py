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
        "metadata": {
            "manifest_count": 18,
            "document_count": len(documents),
            "scale_readiness": "Production-scale" if len(documents) > 100 else "Sample-scale"
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Gita verses at {output_file}")


def build_upanishads_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    # 1. Load all upanishad manifests (upanishad_*.json)
    upanishad_manifests = sorted(manifests_dir.glob("upanishad_*.json"))
    manifest_count = 0
    for manifest_path in upanishad_manifests:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        manifest_count += 1
        doc_id = manifest.get("doc_id", manifest_path.stem)
        section_id = manifest.get("section_id", "")

        for verse in manifest.get("content", []):
            ref = verse.get("ref", "")
            sanskrit = verse.get("sanskrit", "")
            transliteration = verse.get("transliteration", "")
            text = verse.get("text", "")

            # Inject boosted metadata prefix to prioritize reference matches
            ref_parts = ref.split(".")
            ref_words = f"upanishad {section_id} chapter {ref.replace('.', ' verse ')}"
            boosted_metadata = f"{ref_words} {ref} " * 10
            combined_text = f"{boosted_metadata} upanishads principal {sanskrit} {transliteration} {text}"
            tokens = tokenize(combined_text)

            documents.append({
                "id": f"{doc_id}_{ref}",
                "ref": ref,
                "chapter": int(ref_parts[0]) if len(ref_parts) > 0 and ref_parts[0].isdigit() else 1,
                "upanishad": section_id,
                "sanskrit": sanskrit,
                "transliteration": transliteration,
                "text": text,
                "tokens": tokens,
            })

    if not documents:
        print("No Upanishads documents found.")
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
        "metadata": {
            "manifest_count": manifest_count,
            "document_count": len(documents),
            "scale_readiness": "Production-scale" if len(documents) > 100 else "Sample-scale"
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Upanishads verses at {output_file}")


def build_gurbani_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    # 1. Load all Gurbani manifests (sikh_gurbani_*.json)
    gurbani_manifests = sorted(manifests_dir.glob("sikh_gurbani_*.json"))
    manifest_count = 0
    for manifest_path in gurbani_manifests:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        manifest_count += 1
        doc_id = manifest.get("doc_id", manifest_path.stem)
        section_id = manifest.get("section_id", "gurbani")

        for verse in manifest.get("content", []):
            ref = verse.get("ref", "")
            original = verse.get("original", "")
            transliteration = verse.get("transliteration", "")
            text = verse.get("text", "")

            # Inject boosted metadata prefix to prioritize reference matches
            ref_parts = ref.split(".")
            ref_words = f"{section_id} shabad pauri {ref.replace('.', ' line ')}"
            boosted_metadata = f"{ref_words} {ref} " * 10
            combined_text = f"{boosted_metadata} gurbani sri guru granth sahib {original} {transliteration} {text}"
            tokens = tokenize(combined_text)

            documents.append({
                "id": f"{doc_id}_{ref}",
                "ref": ref,
                "chapter": int(ref_parts[0]) if len(ref_parts) > 0 and ref_parts[0].isdigit() else 1,
                "bani": section_id,
                "original": original,
                "transliteration": transliteration,
                "text": text,
                "tokens": tokens,
            })

    if not documents:
        print("No Sikh Gurbani documents found.")
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
            "original": doc["original"],
            "transliteration": doc["transliteration"],
            "text": doc["text"],
            "vector": normalized_tfidf,
        })

    # 5. Save index
    index_data = {
        "metadata": {
            "manifest_count": manifest_count,
            "document_count": len(documents),
            "scale_readiness": "Production-scale" if len(documents) > 100 else "Sample-scale"
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Gurbani lines at {output_file}")


def build_buddhist_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    manifests = sorted(manifests_dir.glob("buddhist_*.json"))
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
            text = verse.get("text", "")

            ref_parts = ref.split(".")
            ref_words = f"buddhist dhamma chapter {ref.replace('.', ' verse ')}"
            boosted_metadata = f"{ref_words} {ref} " * 10
            combined_text = f"{boosted_metadata} buddhist dhamma {sanskrit} {transliteration} {text}"
            tokens = tokenize(combined_text)

            documents.append({
                "id": f"{doc_id}_{ref}",
                "ref": ref,
                "chapter": int(ref_parts[0]) if len(ref_parts) > 0 and ref_parts[0].isdigit() else 1,
                "sanskrit": sanskrit,
                "transliteration": transliteration,
                "text": text,
                "tokens": tokens,
            })

    if not documents:
        print("No Buddhist Dhamma documents found.")
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
            "chapter": doc["chapter"],
            "sanskrit": doc["sanskrit"],
            "transliteration": doc["transliteration"],
            "text": doc["text"],
            "vector": normalized_tfidf,
        })

    index_data = {
        "metadata": {
            "manifest_count": manifest_count,
            "document_count": len(documents),
            "scale_readiness": "Production-scale" if len(documents) > 100 else "Sample-scale"
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Buddhist Dhamma passages at {output_file}")


def build_jain_index(manifests_dir: Path, output_file: Path) -> None:
    documents = []
    manifests = sorted(manifests_dir.glob("jain_*.json"))
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
            text = verse.get("text", "")

            ref_parts = ref.split(".")
            ref_words = f"jain dharma chapter {ref.replace('.', ' verse ')}"
            boosted_metadata = f"{ref_words} {ref} " * 10
            combined_text = f"{boosted_metadata} jain dharma {sanskrit} {transliteration} {text}"
            tokens = tokenize(combined_text)

            documents.append({
                "id": f"{doc_id}_{ref}",
                "ref": ref,
                "chapter": int(ref_parts[0]) if len(ref_parts) > 0 and ref_parts[0].isdigit() else 1,
                "sanskrit": sanskrit,
                "transliteration": transliteration,
                "text": text,
                "tokens": tokens,
            })

    if not documents:
        print("No Jain Dharma documents found.")
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
            "chapter": doc["chapter"],
            "sanskrit": doc["sanskrit"],
            "transliteration": doc["transliteration"],
            "text": doc["text"],
            "vector": normalized_tfidf,
        })

    index_data = {
        "metadata": {
            "manifest_count": manifest_count,
            "document_count": len(documents),
            "scale_readiness": "Production-scale" if len(documents) > 100 else "Sample-scale"
        },
        "idf": idf,
        "documents": indexed_docs,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index for {len(documents)} Jain Dharma passages at {output_file}")


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    manifests_dir = root / "corpus" / "manifests"
    
    gita_output = root / "corpus" / "gita_index.json"
    build_gita_index(manifests_dir, gita_output)
    
    upanishads_output = root / "corpus" / "upanishads_index.json"
    build_upanishads_index(manifests_dir, upanishads_output)

    gurbani_output = root / "corpus" / "gurbani_index.json"
    build_gurbani_index(manifests_dir, gurbani_output)

    buddhist_output = root / "corpus" / "buddhist_dhamma_index.json"
    build_buddhist_index(manifests_dir, buddhist_output)

    jain_output = root / "corpus" / "jain_dharma_index.json"
    build_jain_index(manifests_dir, jain_output)


if __name__ == "__main__":
    main()
