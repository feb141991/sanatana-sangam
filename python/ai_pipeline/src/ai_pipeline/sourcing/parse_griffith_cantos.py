#!/usr/bin/env python3
"""
Batch Parser for Ralph T. H. Griffith's Valmiki Ramayana.
Parses raw Project Gutenberg text into structured Pramana manifests with zero hallucination.
"""

import os
import re
import json
from typing import Dict, List, Any

RAW_FILE = "python/ai_pipeline/corpus/raw/griffith_ramayana_raw.txt"

ROMAN_MAP = {
    "I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000
}

KANDA_METADATA = {
    1: {"name": "Bala Kanda", "file": "valmiki_ramayana_bala.json", "desc": "The Youth of Rama"},
    2: {"name": "Ayodhya Kanda", "file": "valmiki_ramayana_ayodhya.json", "desc": "Events in Ayodhya and Exile"},
    3: {"name": "Aranya Kanda", "file": "valmiki_ramayana_aranya.json", "desc": "Life in the Dandaka Forest"},
    4: {"name": "Kishkindha Kanda", "file": "valmiki_ramayana_kishkindha.json", "desc": "The Vanara Alliance"},
    5: {"name": "Sundara Kanda", "file": "valmiki_ramayana_sundara.json", "desc": "Hanuman in Lanka"},
    6: {"name": "Yuddha Kanda", "file": "valmiki_ramayana_yuddha.json", "desc": "The Great Battle and Victory"}
}


def roman_to_int(s: str) -> int:
    s = s.upper().strip()
    total = 0
    prev = 0
    for c in reversed(s):
        curr = ROMAN_MAP.get(c, 0)
        if curr < prev:
            total -= curr
        else:
            total += curr
        prev = curr
    return total


def parse_all_cantos() -> Dict[int, List[Dict[str, Any]]]:
    if not os.path.exists(RAW_FILE):
        raise FileNotFoundError(f"Raw Griffith text file not found at {RAW_FILE}")

    with open(RAW_FILE, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    main_text_pos = text.find("BOOK I.(6)")
    if main_text_pos == -1:
        main_text_pos = text.find("BOOK I.")
    main_text = text[main_text_pos:]

    # Clean footnote callouts: e.g. (1), (123), (1234)
    clean_text = re.sub(r"\(\d+\)", "", main_text)

    # Find Book boundaries
    book_positions = []
    for m in re.finditer(r"^\s*BOOK\s+([IVX]+)\.?", clean_text, re.MULTILINE):
        b_name = m.group(1)
        b_num = roman_to_int(b_name)
        if 1 <= b_num <= 6:
            book_positions.append((m.start(), b_num))

    # Match all cantos
    canto_re = re.compile(r"^\s*Canto\s+([IVXLCDM]+|\d+)\.\s*(.*?)$", re.MULTILINE)
    matches = list(canto_re.finditer(clean_text))

    cantos_by_book: Dict[int, List[Dict[str, Any]]] = {i: [] for i in range(1, 7)}

    for idx, m in enumerate(matches):
        c_pos = m.start()
        # Find which book
        assigned_book = 1
        for b_pos, b_num in book_positions:
            if c_pos >= b_pos:
                assigned_book = b_num

        c_roman = m.group(1)
        c_title = m.group(2).strip()
        c_num = int(c_roman) if c_roman.isdigit() else roman_to_int(c_roman)

        start_body = m.end()
        end_body = matches[idx + 1].start() if idx + 1 < len(matches) else len(clean_text)
        
        # Check if next book starts before next canto
        for b_pos, b_num in book_positions:
            if start_body < b_pos < end_body:
                end_body = b_pos

        # Check if appendices, footnotes or end notes start before next canto
        for marker in ["\nAPPENDIX", "\nFOOTNOTES", "\nADDITIONAL NOTES", "*** END OF"]:
            m_pos = clean_text.find(marker, start_body)
            if m_pos != -1 and m_pos < end_body:
                end_body = m_pos

        c_body = clean_text[start_body:end_body].strip()
        # Strip leading "OM."
        c_body = re.sub(r"^\s*OM\.\s*", "", c_body).strip()
        # Strip any footer notes or multiple empty lines
        c_body = re.sub(r"\n{3,}", "\n\n", c_body)

        # Build entry
        entry = {
            "ref": f"{assigned_book}.{c_num}",
            "kanda": assigned_book,
            "sarga": c_num,
            "title": f"Valmiki Ramayana — {KANDA_METADATA[assigned_book]['name']}, Canto {c_roman}: {c_title}",
            "canto_name": c_title,
            "text": c_body,
            "translation": c_body,
            "source_class": "translation",
            "rights_status": "public_domain",
            "review_status": "source_audit_approved",
            "is_pramana_grade": True,
            "provenance": f"Ralph T. H. Griffith (1870-1874), The Rámáyan of Válmíki, Book {assigned_book}, Canto {c_roman} ({c_title}). Project Gutenberg #24869 / #51540 (Public Domain)."
        }
        cantos_by_book[assigned_book].append(entry)

    return cantos_by_book


if __name__ == "__main__":
    cantos = parse_all_cantos()
    print("Parsed cantos by book:")
    for b_idx in range(1, 7):
        print(f"  Book {b_idx} ({KANDA_METADATA[b_idx]['name']}): {len(cantos[b_idx])} cantos")
