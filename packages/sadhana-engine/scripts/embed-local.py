#!/usr/bin/env python3
"""
Local Scripture Embedding Generator (offline, no HuggingFace download needed)
Uses TF-IDF + TruncatedSVD to produce 384-dimensional semantic vectors.
Compatible with the scripture_chunks table (vector(384)).

Upgrade path: once network access is available, replace with
  embed-scriptures.py using all-MiniLM-L6-v2 for stronger embeddings.

Usage:
    python embed-local.py --file ../supabase/seed/gita-full.json --dry-run
    python embed-local.py --file ../supabase/seed/gita-full.json --key YOUR_SERVICE_ROLE_KEY
"""

import json
import argparse
import os
import sys
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize

SUPABASE_URL = "https://mnbwodcswxoojndytngu.supabase.co"
EMBEDDING_DIM = 384


def load_scripture(filepath: str) -> list[dict]:
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict) and "verses" in data:
        return data["verses"]
    if isinstance(data, list):
        return data
    raise ValueError(f"Unexpected JSON structure in {filepath}")


def build_searchable_text(v: dict) -> str:
    """Build rich text for embedding: translation + transliteration + tags."""
    parts = []
    if v.get("translation") and not v["translation"].startswith("[Translation pending"):
        parts.append(v["translation"])
    if v.get("transliteration"):
        # Add transliteration but strip pipe separators
        translit = v["transliteration"].replace(" / ", " ")
        parts.append(translit)
    if v.get("commentary"):
        parts.append(v["commentary"])
    if v.get("tags"):
        # Repeat tags 2x to boost their weight in TF-IDF
        tag_text = " ".join(v["tags"])
        parts.append(tag_text)
        parts.append(tag_text)
    # Add chapter/verse context
    parts.append(f"chapter {v.get('chapter', '')} verse {v.get('verse', '')}")
    return " ".join(parts)


def generate_embeddings(verses: list[dict]) -> tuple[list[dict], TfidfVectorizer, TruncatedSVD]:
    """Generate 384-dim LSA embeddings using TF-IDF + TruncatedSVD."""

    print(f"Building searchable text for {len(verses)} verses...")
    texts = [build_searchable_text(v) for v in verses]

    print("Fitting TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),     # unigrams + bigrams for richer semantics
        max_features=50000,
        sublinear_tf=True,      # log(tf) — handles frequency imbalance
        min_df=1,
        strip_accents=None,     # preserve Sanskrit transliteration diacritics
        analyzer='word',
        token_pattern=r"(?u)\b\w+\b"
    )
    tfidf_matrix = vectorizer.fit_transform(texts)
    print(f"  TF-IDF matrix: {tfidf_matrix.shape}")

    print(f"Reducing to {EMBEDDING_DIM} dimensions with TruncatedSVD (LSA)...")
    n_components = min(EMBEDDING_DIM, tfidf_matrix.shape[1] - 1, tfidf_matrix.shape[0] - 1)
    svd = TruncatedSVD(n_components=n_components, n_iter=7, random_state=42)
    lsa_matrix = svd.fit_transform(tfidf_matrix)
    print(f"  Explained variance: {svd.explained_variance_ratio_.sum():.3f}")

    # Normalise to unit vectors (cosine similarity compatible)
    lsa_matrix = normalize(lsa_matrix, norm='l2')

    # Pad to exactly 384 dims if SVD produced fewer
    if lsa_matrix.shape[1] < EMBEDDING_DIM:
        padding = np.zeros((lsa_matrix.shape[0], EMBEDDING_DIM - lsa_matrix.shape[1]))
        lsa_matrix = np.hstack([lsa_matrix, padding])
        print(f"  Padded to {EMBEDDING_DIM} dimensions")

    print(f"  Final embedding shape: {lsa_matrix.shape}")

    # Attach embeddings to verse dicts
    for i, v in enumerate(verses):
        v["embedding"] = lsa_matrix[i].tolist()

    return verses, vectorizer, svd


def save_dry_run(verses: list[dict], filepath: str):
    """Save a sample for inspection."""
    sample = []
    for v in verses[:5]:
        s = dict(v)
        s["embedding"] = s["embedding"][:10]  # first 10 dims only
        sample.append(s)
    out = Path(filepath).stem + "_sample_embeddings.json"
    with open(out, "w") as f:
        json.dump(sample, f, indent=2)
    print(f"Sample saved to {out} (first 5 verses, first 10 embedding dims)")


def upload_to_supabase(verses: list[dict], url: str, key: str):
    """Upload verses with embeddings to Supabase in batches of 50."""
    try:
        from supabase import create_client
    except ImportError:
        print("Install supabase-py: pip install supabase")
        sys.exit(1)

    print(f"Connecting to Supabase: {url}")
    client = create_client(url, key)

    batch_size = 50
    total = len(verses)
    uploaded = 0
    failed = 0

    for i in range(0, total, batch_size):
        batch = verses[i:i + batch_size]
        rows = []
        for v in batch:
            rows.append({
                "text_id": v.get("text_id", "gita"),
                "chapter": v["chapter"],
                "verse": v["verse"],
                "sanskrit": v.get("sanskrit", ""),
                "transliteration": v.get("transliteration", ""),
                "translation": v["translation"],
                "commentary": v.get("commentary", ""),
                "word_by_word": v.get("word_by_word"),
                "tags": v.get("tags", []),
                "embedding": v["embedding"],
            })

        try:
            result = client.table("scripture_chunks").upsert(
                rows,
                on_conflict="text_id,chapter,verse"
            ).execute()
            uploaded += len(batch)
            print(f"  Uploaded {uploaded}/{total} verses")
        except Exception as e:
            print(f"  ERROR on batch {i//batch_size + 1}: {e}")
            failed += len(batch)

    print(f"\nDone! {uploaded} uploaded, {failed} failed.")
    return uploaded, failed


def main():
    parser = argparse.ArgumentParser(description="Generate local embeddings and upload to Supabase")
    parser.add_argument("--file", required=True, help="Path to scripture JSON file")
    parser.add_argument("--key", default="", help="Supabase service role key")
    parser.add_argument("--url", default=SUPABASE_URL, help="Supabase project URL")
    parser.add_argument("--dry-run", action="store_true", help="Generate embeddings but don't upload")
    args = parser.parse_args()

    supabase_key = args.key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_key and not args.dry_run:
        print("Error: Provide Supabase service role key via --key or SUPABASE_SERVICE_ROLE_KEY env var")
        sys.exit(1)

    # Load
    verses = load_scripture(args.file)
    print(f"Loaded {len(verses)} verses from {args.file}")

    # Generate
    verses, vectorizer, svd = generate_embeddings(verses)

    if args.dry_run:
        print("\nDry run — skipping upload.")
        save_dry_run(verses, args.file)
        print("\nEmbedding stats:")
        emb_array = np.array([v["embedding"] for v in verses])
        print(f"  Shape: {emb_array.shape}")
        print(f"  Mean norm: {np.linalg.norm(emb_array, axis=1).mean():.4f} (should be ~1.0)")
        print(f"  Sample cosine sim (verse 1 vs 2): {np.dot(emb_array[0], emb_array[1]):.4f}")
        print(f"  Sample cosine sim (verse 1 vs 47): {np.dot(emb_array[0], emb_array[46]):.4f}")

        # Test semantic similarity
        print("\nSemantic similarity spot check:")
        karma_idx = next(i for i, v in enumerate(verses) if v["chapter"] == 2 and v["verse"] == 47)
        action_idx = next(i for i, v in enumerate(verses) if v["chapter"] == 3 and v["verse"] == 19)
        guna_idx = next(i for i, v in enumerate(verses) if v["chapter"] == 14 and v["verse"] == 5)
        print(f"  Gita 2.47 ↔ 3.19 (both karma yoga): {np.dot(emb_array[karma_idx], emb_array[action_idx]):.4f}")
        print(f"  Gita 2.47 ↔ 14.5 (different theme): {np.dot(emb_array[karma_idx], emb_array[guna_idx]):.4f}")
    else:
        uploaded, failed = upload_to_supabase(verses, args.url, supabase_key)
        if uploaded > 0:
            print(f"\nPhase 1 complete! {uploaded} Gita verses are now in Supabase pgvector.")
            print("Next: run the SQL migration if not done, then test the match_scriptures function.")


if __name__ == "__main__":
    main()
