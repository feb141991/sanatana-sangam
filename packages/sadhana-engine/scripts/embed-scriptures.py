#!/usr/bin/env python3
"""
Scripture Embedding Generator
Reads scripture JSON files, generates vector embeddings using a local
HuggingFace model, and uploads to Supabase pgvector.

Usage:
    pip install sentence-transformers supabase
    python embed-scriptures.py --file ../supabase/seed/gita-sample.json

Cost: £0 — runs entirely on your laptop
"""

import json
import argparse
import sys
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
    from supabase import create_client
except ImportError:
    print("Install dependencies first:")
    print("  pip install sentence-transformers supabase")
    sys.exit(1)

# Config
MODEL_NAME = "all-MiniLM-L6-v2"  # 384 dimensions, fast, free
SUPABASE_URL = "https://mnbwodcswxoojndytngu.supabase.co"
SUPABASE_KEY = ""  # Set via --key flag or SUPABASE_SERVICE_ROLE_KEY env var

def load_scripture(filepath: str) -> list[dict]:
    """Load scripture JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if isinstance(data, dict) and "verses" in data:
        return data["verses"]
    if isinstance(data, list):
        return data
    
    raise ValueError(f"Unexpected JSON structure in {filepath}")

def generate_embeddings(verses: list[dict], model: SentenceTransformer) -> list[dict]:
    """Generate embeddings for each verse."""
    
    # Build searchable text: combine translation + tags for richer semantic matching
    texts = []
    for v in verses:
        parts = [
            v.get("translation", ""),
            v.get("commentary", ""),
            " ".join(v.get("tags", [])),
        ]
        texts.append(" ".join(p for p in parts if p))
    
    print(f"Generating embeddings for {len(texts)} verses...")
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)
    
    for i, v in enumerate(verses):
        v["embedding"] = embeddings[i].tolist()
    
    return verses

def upload_to_supabase(verses: list[dict], supabase_url: str, supabase_key: str):
    """Upload verses with embeddings to Supabase."""
    
    client = create_client(supabase_url, supabase_key)
    
    # Upload in batches of 50
    batch_size = 50
    total = len(verses)
    uploaded = 0
    
    for i in range(0, total, batch_size):
        batch = verses[i:i + batch_size]
        rows = []
        
        for v in batch:
            rows.append({
                "text_id": v["text_id"],
                "chapter": v["chapter"],
                "verse": v["verse"],
                "sanskrit": v["sanskrit"],
                "transliteration": v.get("transliteration", ""),
                "translation": v["translation"],
                "word_by_word": v.get("word_by_word"),
                "commentary": v.get("commentary", ""),
                "tags": v.get("tags", []),
                "embedding": v["embedding"],
            })
        
        result = client.table("scripture_chunks").upsert(
            rows,
            on_conflict="text_id,chapter,verse"
        ).execute()
        
        uploaded += len(batch)
        print(f"  Uploaded {uploaded}/{total}")
    
    print(f"Done! {uploaded} verses uploaded to Supabase.")

def main():
    parser = argparse.ArgumentParser(description="Generate and upload scripture embeddings")
    parser.add_argument("--file", required=True, help="Path to scripture JSON file")
    parser.add_argument("--key", default="", help="Supabase service role key")
    parser.add_argument("--url", default=SUPABASE_URL, help="Supabase project URL")
    parser.add_argument("--dry-run", action="store_true", help="Generate embeddings but don't upload")
    args = parser.parse_args()
    
    import os
    supabase_key = args.key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_key and not args.dry_run:
        print("Error: Provide Supabase service role key via --key or SUPABASE_SERVICE_ROLE_KEY env var")
        sys.exit(1)
    
    # Load model
    print(f"Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print(f"Model loaded. Embedding dimension: {model.get_sentence_embedding_dimension()}")
    
    # Load scripture
    verses = load_scripture(args.file)
    print(f"Loaded {len(verses)} verses from {args.file}")
    
    # Generate embeddings
    verses = generate_embeddings(verses, model)
    
    if args.dry_run:
        print("Dry run — skipping upload.")
        # Save to file for inspection
        out_path = Path(args.file).stem + "_with_embeddings.json"
        with open(out_path, "w") as f:
            json.dump(verses[:3], f, indent=2)  # save first 3 for inspection
        print(f"Sample saved to {out_path}")
    else:
        upload_to_supabase(verses, args.url, supabase_key)

if __name__ == "__main__":
    main()
