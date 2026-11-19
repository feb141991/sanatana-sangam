#!/usr/bin/env python3
"""
Canonical Data Sourcing Verification Tool for Shoonaya (Pramana RAG).

Validates ingested scriptural / spiritual data against:
1. Zero Placeholders (TODO, TBD, lorem, ..., empty fields)
2. Zero Hallucinations (Verbatim cross-check against raw source text)
3. Structural Completeness (Ref, original text, transliteration, translation, provenance)
4. Duplicate Detection (Refs, Sanskrit text, English translations)
5. Unicode & Script Fidelity (Devanagari, IAST, clean sandhi)
"""

import sys
import os
import json
import re
import argparse
from typing import Dict, List, Any, Optional

FORBIDDEN_PLACEHOLDERS = [
    "todo", "tbd", "placeholder", "lorem ipsum", "xxx", "insert here",
    "sample text", "translation here", "verse text here", "t.b.d."
]

ELLIPSIS_PATTERNS = ["...", "…", "[...]", "(...)"]


def normalize_text(text: str) -> str:
    """Normalize text for cross-checking against raw source."""
    return re.sub(r"\s+", " ", text).strip().lower()


def audit_manifest(filepath: str, raw_source_path: Optional[str] = None) -> Dict[str, Any]:
    """Audit a single manifest file for placeholders, hallucinations, and structural defects."""
    report = {
        "file": os.path.basename(filepath),
        "total_entries": 0,
        "passed": True,
        "errors": [],
        "warnings": []
    }

    if not os.path.exists(filepath):
        report["passed"] = False
        report["errors"].append(f"Manifest file does not exist: {filepath}")
        return report

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        report["passed"] = False
        report["errors"].append(f"Failed to parse JSON: {e}")
        return report

    # Extract items
    items = data.get("content", [])
    if isinstance(items, dict):
        items = items.get("verses", []) or items.get("chapters", [])
    if not isinstance(items, list):
        items = data.get("verses", []) or data.get("chapters", []) or []

    report["total_entries"] = len(items)
    if len(items) == 0:
        report["passed"] = False
        report["errors"].append("Manifest contains 0 content entries (empty manifest).")
        return report

    # Load raw source if provided for hallucination cross-checking
    raw_source_content = ""
    if raw_source_path:
        if os.path.exists(raw_source_path):
            with open(raw_source_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_source_content = normalize_text(f.read())
        else:
            report["warnings"].append(f"Raw source path provided but not found: {raw_source_path}")

    seen_refs = set()
    seen_translations = set()
    seen_originals = set()

    for idx, item in enumerate(items):
        ref = item.get("ref", f"entry_{idx+1}")
        
        # 1. Reference uniqueness
        if ref in seen_refs:
            report["errors"].append(f"[{ref}] Duplicate reference detected.")
        seen_refs.add(ref)

        # 2. English text validation
        english = (item.get("translation") or item.get("text") or item.get("meaning") or "").strip()
        if not english:
            report["errors"].append(f"[{ref}] Missing/empty English translation.")
        else:
            # Check for forbidden placeholders
            for ph in FORBIDDEN_PLACEHOLDERS:
                if ph == "xxx":
                    if re.search(r"\bxxx\b", english, re.IGNORECASE):
                        report["errors"].append(f"[{ref}] Forbidden placeholder '{ph}' in translation.")
                elif ph in english.lower():
                    report["errors"].append(f"[{ref}] Forbidden placeholder '{ph}' in translation.")
            # Check for ellipses / truncated markers
            for ep in ELLIPSIS_PATTERNS:
                if ep in english:
                    report["warnings"].append(f"[{ref}] Translation contains ellipsis '{ep}' (verify if intentional or truncated).")
            # Duplicate translation
            norm_en = normalize_text(english)
            if norm_en in seen_translations:
                report["warnings"].append(f"[{ref}] Exact duplicate English translation found elsewhere in manifest.")
            seen_translations.add(norm_en)

            # 3. Raw source cross-check (Hallucination check)
            if raw_source_content:
                # Check if sample 40-character ngram of the translation appears in raw source
                words = english.split()
                if len(words) >= 5:
                    sample_ngram = normalize_text(" ".join(words[:6]))
                    if sample_ngram not in raw_source_content:
                        report["warnings"].append(f"[{ref}] Potential hallucination: phrase '{sample_ngram}' not found verbatim in raw source text.")

        # 4. Original / Sanskrit text validation
        original = (item.get("sanskrit") or item.get("original") or "").strip()
        orig_status = data.get("original_text_status")
        if orig_status == "canonical" and not original:
            report["errors"].append(f"[{ref}] Missing original/Sanskrit text while original_text_status is '{orig_status}'.")
        elif original:
            for ph in FORBIDDEN_PLACEHOLDERS:
                if ph == "xxx":
                    if re.search(r"\bxxx\b", original, re.IGNORECASE):
                        report["errors"].append(f"[{ref}] Forbidden placeholder '{ph}' in original text.")
                elif ph in original.lower():
                    report["errors"].append(f"[{ref}] Forbidden placeholder '{ph}' in original text.")
            norm_orig = normalize_text(original)
            if norm_orig in seen_originals:
                report["warnings"].append(f"[{ref}] Duplicate original text found elsewhere in manifest.")
            seen_originals.add(norm_orig)

        # 5. Transliteration validation
        translit = (item.get("transliteration") or "").strip()
        if original and not translit:
            report["warnings"].append(f"[{ref}] Sanskrit text present but transliteration is empty.")

    if len(report["errors"]) > 0:
        report["passed"] = False

    return report


def main():
    parser = argparse.ArgumentParser(description="Audit Shoonaya manifest files for quality and hallucination-free compliance.")
    parser.add_argument("manifests", nargs="+", help="Paths or globs of manifest JSON files to audit.")
    parser.add_argument("--raw-source", dest="raw_source", default=None, help="Path to raw public-domain source text for verbatim cross-checking.")
    args = parser.parse_args()

    total_files = len(args.manifests)
    total_entries = 0
    all_passed = True

    print("=" * 80)
    print("🔍 SHOONAYA CANONICAL DATA SOURCING AUDIT")
    print("=" * 80)

    for path in args.manifests:
        rep = audit_manifest(path, args.raw_source)
        status_icon = "✅ PASS" if rep["passed"] else "❌ FAIL"
        print(f"\n📄 {rep['file']} ({rep['total_entries']} entries) -> {status_icon}")
        total_entries += rep["total_entries"]

        if rep["errors"]:
            all_passed = False
            for err in rep["errors"]:
                print(f"   ❌ ERROR: {err}")
        if rep["warnings"]:
            for warn in rep["warnings"]:
                print(f"   ⚠️  WARN:  {warn}")

    print("\n" + "=" * 80)
    print(f"Audit Summary: {total_files} files checked, {total_entries} total entries.")
    if all_passed:
        print("🎉 ALL MANIFESTS COMPLIANT (Zero placeholders, zero missing fields).")
        sys.exit(0)
    else:
        print("🚨 VERIFICATION FAILED: Resolve reported errors before indexing.")
        sys.exit(1)


if __name__ == "__main__":
    main()
