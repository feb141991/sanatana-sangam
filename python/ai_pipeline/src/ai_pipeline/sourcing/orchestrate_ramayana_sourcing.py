#!/usr/bin/env python3
"""
Orchestrates full batch ingestion of Ralph T. H. Griffith's Valmiki Ramayana across all 6 Kandas.
Runs in verified batches of 25-35 sargas, ensuring zero placeholders and zero hallucinations.
"""

import sys
import os
import subprocess

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from ingest_batch import ingest_batch

BATCHES = [
    # Kanda 1: Bala Kanda (75 cantos)
    (1, 1, 25),
    (1, 26, 50),
    (1, 51, 75),
    # Kanda 2: Ayodhya Kanda (119 cantos)
    (2, 1, 30),
    (2, 31, 60),
    (2, 61, 90),
    (2, 91, 119),
    # Kanda 3: Aranya Kanda (76 cantos)
    (3, 1, 30),
    (3, 31, 60),
    (3, 61, 76),
    # Kanda 4: Kishkindha Kanda (67 cantos)
    (4, 1, 35),
    (4, 36, 67),
    # Kanda 5: Sundara Kanda (55 cantos)
    (5, 1, 30),
    (5, 31, 55),
    # Kanda 6: Yuddha Kanda (101 cantos)
    (6, 1, 35),
    (6, 36, 70),
    (6, 71, 101),
]


def run_cmd(cmd: str, desc: str) -> bool:
    print(f"\n--- {desc} ---")
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"❌ Failed: {desc}")
        return False
    return True


def main():
    print("=" * 80)
    print("🚀 STARTING ORCHESTRATED RAMAYANA BATCH SOURCING")
    print(f"Total batches to process: {len(BATCHES)}")
    print("=" * 80)

    for idx, (kanda, start_s, end_s) in enumerate(BATCHES):
        print(f"\n[{idx + 1}/{len(BATCHES)}] Processing Kanda {kanda}, Sargas {start_s}..{end_s}...")
        ok = ingest_batch(kanda, start_s, end_s)
        if not ok:
            print(f"❌ Halting: Batch {idx + 1} failed verification.")
            sys.exit(1)

    print("\n" + "=" * 80)
    print("✅ ALL 17 BATCHES INGESTED & AUDITED (Zero placeholders, zero errors)")
    print("=" * 80)

    # Rebuild sparse index
    if not run_cmd("python3 python/ai_pipeline/src/ai_pipeline/embeddings/build_ramayana_index.py", "Rebuilding BM25 Sparse Index"):
        sys.exit(1)

    # Rebuild dense embeddings
    if not run_cmd("npx tsx scripts/build-dense-embeddings.mts ramayana", "Rebuilding MiniLM Dense Neural Embeddings"):
        sys.exit(1)

    # Validate indexes
    if not run_cmd("PYTHONPATH=python/ai_pipeline/src python3 python/ai_pipeline/src/ai_pipeline/embeddings/validate_indexes.py", "Validating Corpus Indexes"):
        sys.exit(1)

    print("\n🎉 ORCHESTRATION COMPLETE! All 493 cantos onboarded and validated.")


if __name__ == "__main__":
    main()
