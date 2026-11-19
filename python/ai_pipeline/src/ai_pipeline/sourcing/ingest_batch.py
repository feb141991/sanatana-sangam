#!/usr/bin/env python3
"""
Batch Ingestion and Verification Runner for Valmiki Ramayana.
Applies cantos in batches of 20-30, runs verify_sourcing, and ensures zero defects.
"""

import sys
import os
import json
import argparse
import subprocess
from typing import Dict, List, Any

# Ensure local sourcing package is on path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from parse_griffith_cantos import parse_all_cantos, KANDA_METADATA
from verify_sourcing import audit_manifest

RAW_FILE = "python/ai_pipeline/corpus/raw/griffith_ramayana_raw.txt"


def ingest_batch(kanda: int, start_sarga: int, end_sarga: int) -> bool:
    print(f"\n================================================================================")
    print(f"📦 INGESTING BATCH: Kanda {kanda} ({KANDA_METADATA[kanda]['name']}), Sargas {start_sarga} to {end_sarga}")
    print(f"================================================================================")

    manifest_fname = KANDA_METADATA[kanda]["file"]
    manifest_path = os.path.join("python/ai_pipeline/corpus/manifests", manifest_fname)

    if not os.path.exists(manifest_path):
        print(f"❌ Manifest not found: {manifest_path}")
        return False

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)

    existing_content = manifest_data.get("content", [])
    existing_by_ref = {item.get("ref"): item for item in existing_content}

    # Parse all cantos from raw Griffith text
    all_cantos_by_book = parse_all_cantos()
    kanda_cantos = all_cantos_by_book.get(kanda, [])

    # Filter for the batch range
    batch_cantos = [
        c for c in kanda_cantos
        if start_sarga <= c["sarga"] <= end_sarga
    ]

    print(f"Found {len(batch_cantos)} cantos in range {start_sarga}..{end_sarga}")

    added_count = 0
    updated_count = 0

    for c in batch_cantos:
        ref = c["ref"]
        if ref in existing_by_ref:
            # Update text with full verified canto text if needed
            existing_by_ref[ref].update(c)
            updated_count += 1
        else:
            existing_by_ref[ref] = c
            added_count += 1

    # Sort content: landmarks and cantos ordered by sarga then shloka/ref
    def sort_key(item):
        sarga = item.get("sarga", 0)
        shloka = item.get("shloka", 0)
        ref = item.get("ref", "")
        # Cantos (e.g. 1.5) before micro-verses (e.g. 1.5.1) or ordered logically
        return (sarga, shloka, ref)

    sorted_content = sorted(existing_by_ref.values(), key=sort_key)
    manifest_data["content"] = sorted_content

    # Write updated manifest
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, ensure_ascii=False, indent=2)

    print(f"Updated {manifest_fname}: {added_count} added, {updated_count} updated. Total entries now: {len(sorted_content)}")

    # Step 2: Run verify_sourcing audit
    audit = audit_manifest(manifest_path, RAW_FILE)
    if not audit["passed"]:
        print(f"❌ Verification FAILED for {manifest_fname}:")
        for err in audit["errors"]:
            print(f"   {err}")
        return False
    print(f"✅ verify_sourcing PASSED with 0 errors for {manifest_fname}!")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest a batch of cantos into Valmiki Ramayana manifests.")
    parser.add_argument("--kanda", type=int, required=True, help="Kanda number (1-6)")
    parser.add_argument("--start", type=int, required=True, help="Start sarga number")
    parser.add_argument("--end", type=int, required=True, help="End sarga number")
    args = parser.parse_args()

    success = ingest_batch(args.kanda, args.start, args.end)
    sys.exit(0 if success else 1)
