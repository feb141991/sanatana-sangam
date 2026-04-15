#!/usr/bin/env python3
"""
Gita Data Fetcher
Fetches all 700 verses from the public-domain Bhagavad Gita API
and transforms into Sangam's scripture_chunks format.

Sources (all public domain / Unlicense):
  - github.com/gita/gita — base verse data
  - ravisiyer.github.io/gita-data/v1 — static JSON API

Usage:
    python fetch-gita.py
    python fetch-gita.py --embed   # also generate embeddings

Output: ../supabase/seed/gita-full.json
"""

import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

API_BASE = "https://ravisiyer.github.io/gita-data/v1"
OUTPUT_DIR = Path(__file__).parent.parent / "supabase" / "seed"

# Chapter verse counts (Gita has 18 chapters, 700 verses total)
CHAPTER_VERSES = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
    10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
}

CHAPTER_NAMES = {
    1: "Arjuna Vishada Yoga", 2: "Sankhya Yoga", 3: "Karma Yoga",
    4: "Jnana Karma Sanyasa Yoga", 5: "Karma Vairagya Yoga",
    6: "Dhyana Yoga", 7: "Jnana Vijnana Yoga",
    8: "Akshara Brahma Yoga", 9: "Raja Vidya Raja Guhya Yoga",
    10: "Vibhuti Yoga", 11: "Vishwarupa Darshana Yoga",
    12: "Bhakti Yoga", 13: "Kshetra Kshetrajna Vibhaga Yoga",
    14: "Gunatraya Vibhaga Yoga", 15: "Purushottama Yoga",
    16: "Daivasura Sampad Vibhaga Yoga", 17: "Shraddhatraya Vibhaga Yoga",
    18: "Moksha Sanyasa Yoga",
}

# Tag mapping — key themes per chapter for semantic search
CHAPTER_TAGS = {
    1: ["grief", "confusion", "compassion", "war", "family"],
    2: ["atman", "soul", "karma_yoga", "equanimity", "wisdom", "action"],
    3: ["karma", "action", "duty", "sacrifice", "desire"],
    4: ["knowledge", "sacrifice", "avatar", "divine_birth", "wisdom"],
    5: ["renunciation", "action", "liberation", "peace"],
    6: ["meditation", "dhyana", "mind", "yoga", "self_discipline"],
    7: ["knowledge", "nature", "divine", "maya", "prakriti"],
    8: ["brahman", "death", "rebirth", "cosmic_cycle", "om"],
    9: ["devotion", "bhakti", "faith", "supreme_secret", "worship"],
    10: ["divine_glory", "vibhuti", "manifestation", "omnipresence"],
    11: ["cosmic_form", "vishwarupa", "awe", "fear", "devotion"],
    12: ["bhakti", "devotion", "qualities", "dear_devotee"],
    13: ["field", "knower", "prakriti", "purusha", "body_soul"],
    14: ["gunas", "sattva", "rajas", "tamas", "nature"],
    15: ["supreme_person", "tree", "detachment", "purushottama"],
    16: ["divine", "demonic", "virtues", "vices", "qualities"],
    17: ["faith", "shraddha", "food", "sacrifice", "austerity"],
    18: ["liberation", "moksha", "renunciation", "surrender", "duty"],
}


def fetch_json(url: str, retries: int = 3) -> dict | list | None:
    """Fetch JSON from URL with retries."""
    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": "Sangam-Scripture-Fetcher/1.0"})
            with urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except (URLError, json.JSONDecodeError) as e:
            print(f"  Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    return None


def fetch_all_verses() -> list[dict]:
    """Fetch verse data from the static API."""
    print("Fetching verse data...")
    verses_data = fetch_json(f"{API_BASE}/verse.json")

    if not verses_data:
        print("Failed to fetch verses. Trying alternative source...")
        # Fallback: build from chapter endpoints
        verses_data = []
        for ch in range(1, 19):
            ch_data = fetch_json(f"{API_BASE}/chapters/{ch}/verses.json")
            if ch_data:
                if isinstance(ch_data, list):
                    verses_data.extend(ch_data)
                elif isinstance(ch_data, dict):
                    verses_data.extend(ch_data.values() if isinstance(ch_data, dict) else [ch_data])
            time.sleep(0.5)

    if not verses_data:
        print("ERROR: Could not fetch any verse data.")
        sys.exit(1)

    print(f"  Fetched {len(verses_data)} verse records")
    return verses_data if isinstance(verses_data, list) else list(verses_data.values())


def fetch_translations() -> dict:
    """Fetch translation data."""
    print("Fetching translations...")
    data = fetch_json(f"{API_BASE}/translation.json")
    if data:
        print(f"  Fetched translation data")
    return data or {}


def transform_to_sangam(verses: list, translations: dict) -> list[dict]:
    """Transform API data into Sangam scripture_chunks format."""
    print("Transforming to Sangam format...")
    sangam_verses = []

    # Build translation lookup by verse ID
    translation_lookup = {}
    if isinstance(translations, list):
        for t in translations:
            vid = t.get("verseNumber") or t.get("verse_id") or ""
            if vid:
                translation_lookup.setdefault(str(vid), []).append(t)
    elif isinstance(translations, dict):
        translation_lookup = translations

    for v in verses:
        # Extract chapter and verse numbers
        ch = v.get("chapter_number") or v.get("chapter") or 0
        vs = v.get("verse_number") or v.get("verse") or 0

        if not ch or not vs:
            # Try parsing from ID like "BG1.1"
            vid = str(v.get("id", "") or v.get("verse_id", ""))
            if "." in vid:
                parts = vid.replace("BG", "").split(".")
                try:
                    ch, vs = int(parts[0]), int(parts[1])
                except (ValueError, IndexError):
                    continue

        if not ch or not vs:
            continue

        sanskrit = v.get("text") or v.get("slok") or v.get("sanskrit", "")
        transliteration = v.get("transliteration") or ""

        # Get English translation (prefer Swami Sivananda or Swami Gambirananda)
        translation = ""
        verse_key = f"BG{ch}.{vs}"

        # Try direct field first
        translation = v.get("translation") or v.get("meaning") or ""

        # Try from translation lookup
        if not translation and verse_key in translation_lookup:
            trans_list = translation_lookup[verse_key]
            if isinstance(trans_list, list):
                for t in trans_list:
                    if t.get("language") == "english" or t.get("lang") == "en":
                        translation = t.get("description") or t.get("text") or ""
                        if translation:
                            break
            elif isinstance(trans_list, dict):
                translation = trans_list.get("description") or trans_list.get("text") or ""

        if not translation:
            translation = f"[Translation pending for Chapter {ch}, Verse {vs}]"

        # Commentary
        commentary = v.get("commentary") or ""

        # Tags from chapter mapping
        tags = list(CHAPTER_TAGS.get(ch, []))

        sangam_verses.append({
            "text_id": "gita",
            "chapter": int(ch),
            "verse": int(vs),
            "sanskrit": sanskrit.strip(),
            "transliteration": transliteration.strip(),
            "translation": translation.strip(),
            "commentary": commentary.strip(),
            "tags": tags,
        })

    # Sort by chapter and verse
    sangam_verses.sort(key=lambda x: (x["chapter"], x["verse"]))

    # Deduplicate
    seen = set()
    deduped = []
    for v in sangam_verses:
        key = (v["chapter"], v["verse"])
        if key not in seen:
            seen.add(key)
            deduped.append(v)

    print(f"  Transformed {len(deduped)} unique verses")
    return deduped


def generate_embeddings(verses: list[dict]) -> list[dict]:
    """Generate embeddings using local HuggingFace model."""
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("sentence-transformers not installed. Skipping embeddings.")
        print("  Install: pip install sentence-transformers")
        return verses

    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    texts = []
    for v in verses:
        parts = [v["translation"], v.get("commentary", ""), " ".join(v.get("tags", []))]
        texts.append(" ".join(p for p in parts if p))

    print(f"Generating embeddings for {len(texts)} verses...")
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)

    for i, v in enumerate(verses):
        v["embedding"] = embeddings[i].tolist()

    print("  Embeddings generated!")
    return verses


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Fetch Bhagavad Gita data for Sangam")
    parser.add_argument("--embed", action="store_true", help="Also generate embeddings")
    parser.add_argument("--output", default=None, help="Output file path")
    args = parser.parse_args()

    # Fetch
    verses = fetch_all_verses()
    translations = fetch_translations()

    # Transform
    sangam_verses = transform_to_sangam(verses, translations)

    if not sangam_verses:
        print("ERROR: No verses transformed. Check API response format.")
        sys.exit(1)

    # Embeddings
    if args.embed:
        sangam_verses = generate_embeddings(sangam_verses)

    # Stats
    chapters = set(v["chapter"] for v in sangam_verses)
    with_sanskrit = sum(1 for v in sangam_verses if v["sanskrit"] and not v["sanskrit"].startswith("["))
    with_trans = sum(1 for v in sangam_verses if v["translation"] and not v["translation"].startswith("["))
    with_embed = sum(1 for v in sangam_verses if "embedding" in v)

    print(f"\n=== Summary ===")
    print(f"  Total verses: {len(sangam_verses)}")
    print(f"  Chapters: {len(chapters)} (expected 18)")
    print(f"  With Sanskrit: {with_sanskrit}")
    print(f"  With translation: {with_trans}")
    print(f"  With embeddings: {with_embed}")

    # Save
    output_path = args.output or str(OUTPUT_DIR / "gita-full.json")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output = {
        "text_id": "gita",
        "name": "Bhagavad Gita",
        "sanskrit_name": "श्रीमद्भगवद्गीता",
        "source": "Public domain data from github.com/gita/gita (Unlicense)",
        "chapters": {str(ch): CHAPTER_NAMES[ch] for ch in range(1, 19)},
        "total_verses": len(sangam_verses),
        "verses": sangam_verses,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to: {output_path}")
    size_mb = Path(output_path).stat().st_size / (1024 * 1024)
    print(f"File size: {size_mb:.1f} MB")

    if not args.embed:
        print(f"\nTo add embeddings, run:")
        print(f"  python {sys.argv[0]} --embed")
        print(f"  OR")
        print(f"  python embed-scriptures.py --file {output_path}")


if __name__ == "__main__":
    main()
