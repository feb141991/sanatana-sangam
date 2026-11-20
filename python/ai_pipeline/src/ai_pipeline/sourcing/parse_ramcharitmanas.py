#!/usr/bin/env python3
"""
Parser for Goswami Tulsidas's Ramcharitmanas.
Slices authentic Devanagari Awadhi verses, generates IAST transliteration via indic_transliteration,
pairs with Frederic Salmon Growse's 1883 public domain English translation,
and generates canonical Shoonaya manifest JSON files.
"""

import os
import sys
import json
import re
from typing import Dict, List, Any, Tuple
from indic_transliteration import sanscript

SUNDARKAND_TITLES = {
    1: "Hanumān's leap from Mount Mahendra & Mount Maināka",
    2: "Encounter with Surasā, Mother of the Nagas",
    3: "Slaying of the shadow-catching demon Sinhikā",
    4: "Hanumān's arrival at Mount Lankā & Lankinī's awakening",
    5: "Entry into Lankā and description of the golden city",
    6: "Searching Ravaṇa's palaces and bedchambers",
    7: "Discovering the temple and dwelling of Vibhīshaṇa",
    8: "Conversation with Vibhīshaṇa and friendship established",
    9: "Hanumān enters the Ashoka Vātikā",
    10: "Sita's grief under the Shimshapa tree and Ravana's threats",
    11: "Trijatā's prophetic dream of Lanka's destruction",
    12: "Sita's lamentation and the dropping of Sri Rama's ring",
    13: "Hanumān reveals himself and sings Sri Rama's praises",
    14: "Dialogue between Mother Sita and Hanumān",
    15: "Hanumān shows his cosmic form to reassure Sita",
    16: "Hanumān asks permission to eat fruits in the Ashoka grove",
    17: "Hanumān lays waste to the grove and slays the demon guards",
    18: "Slaying of Prince Akshaya Kumāra by Hanumān",
    19: "Meghanāda enters the battlefield with the Brahmāstra",
    20: "Hanumān captured by the Brahmāstra and brought before Ravaṇa",
    21: "The demon court assembled before the ten-headed Ravaṇa",
    22: "Hanumān's fearless proclamation in Ravaṇa's royal court",
    23: "Hanumān advises Ravaṇa to surrender Sita to Sri Rama",
    24: "Ravaṇa orders Hanumān's death; Vibhīshaṇa intervenes for diplomatic immunity",
    25: "Ravaṇa orders Hanumān's tail wrapped in oiled cloth and set ablaze",
    26: "Hanumān shrinks his form, leaps atop the towers, and burns Lankā",
    27: "The great conflagration of Lankā and the panic of the demons",
    28: "Hanumān extinguishes his tail in the ocean and visits Sita once more",
    29: "Mother Sita gives her Chūḍāmaṇi jewel as a token of remembrance",
    30: "Hanumān takes leave of Sita and leaps back across the ocean",
    31: "Joyous reunion of Hanumān with Jāmbavān, Angada, and the Vānaras",
    32: "The Vānaras revel in Sugrīva's Madhuvana honey grove",
    33: "Sugrīva hears of the mission's success and welcomes the Vānaras",
    34: "Hanumān delivers Sita's Chūḍāmaṇi and message to Sri Rama",
    35: "Sri Rama embraces Hanumān and praises his unmatched devotion",
    36: "Sri Rama prepares the vast monkey army to march south",
    37: "The march of the Vānara host to the southern ocean shore",
    38: "Ravaṇa convenes his council of war; Vibhīshaṇa urges righteousness",
    39: "Vibhīshaṇa pleads with Ravaṇa to return Sita to Rama",
    40: "Vibhīshaṇa explains the virtues of Sri Rama and warns of ruin",
    41: "Ravaṇa kicks Vibhīshaṇa; Vibhīshaṇa departs to seek Sri Rama's refuge",
    42: "Vibhīshaṇa arrives at Sri Rama's camp on the seashore",
    43: "Sugrīva suspects Vibhīshaṇa; Sri Rama declares his eternal vow of refuge",
    44: "Sri Rama's vow: 'Whosoever seeks my refuge, I shall never abandon'",
    45: "Vibhīshaṇa falls at Sri Rama's lotus feet; Sri Rama embraces him",
    46: "Vibhīshaṇa expresses pure devotion and selfless surrender",
    47: "Sri Rama explains the nature of a true devotee",
    48: "Sri Rama crowns Vibhīshaṇa as King of Lankā with seawater",
    49: "Lakshmaṇa and the Vānara host rejoice at Vibhīshaṇa's coronation",
    50: "Sri Rama seeks counsel on crossing the mighty ocean",
    51: "Sri Rama sits in meditation on Kusha grass before Ocean; Shuka the spy arrives",
    52: "Shuka delivers Ravaṇa's haughty letter to Sugrīva; Lakshmaṇa's reply",
    53: "Lakshmaṇa's warning letter delivered to Ravaṇa in Lankā",
    54: "Shuka describes the boundless might of Sri Rama and his army to Ravaṇa",
    55: "Shuka urges Ravaṇa to surrender; Ravaṇa mocks him",
    56: "Mandodarī cautions Ravaṇa once more to avoid war with Rama",
    57: "Three days of fasting by Sri Rama on the seashore; Ocean remains unyielding",
    58: "Sri Rama's divine wrath: 'Without fear, there can be no true love'",
    59: "Ocean appears in terror, bearing jewels, and pleads for forgiveness",
    60: "Ocean reveals Nala and Nīla's boon to bridge the sea; Glory of Sundar Kand"
}

SUNDAR_MANGALACHARAN_SANSKRIT = """श्लोक
शान्तं शाश्वतमप्रमेयमनघं निर्वाणशान्तिप्रदं
ब्रह्माशम्भुफणीन्द्रसेव्यमनिशं वेदान्तवेद्यं विभुम् ।
रामाख्यं जगदीश्वरं सुरगुरुं मायामनुष्यं हरिं
वन्देऽहं करुणाकरं रघुवरं भूपालचूडामणिम् ॥ १ ॥

नान्या स्पृहा रघुपते हृदयेऽस्मदीये
सत्यं वदामि च भवानखिलान्तरात्मा ।
भक्तिं प्रयच्छ रघुपुङ्गव निर्भरां मे
कामादिदोषरहितं कुरु मानसं च ॥ २ ॥

अतुलितबलधामं हेमशैलाभदेहं
दनुजवनकृशanuṃ ज्ञानिनामग्रगण्यम् ।
सकलगुणनिधानं वानराणामधीशं
रघुपतिप्रियभक्तं वातजातं नमामि ॥ ३ ॥"""


def clean_growse_unit(raw_text: str) -> str:
    """Clean OCR anomalies while preserving word-for-word fidelity to Growse (1883)."""
    text = raw_text.strip()
    # Remove running page headers
    text = re.sub(r'\n\s*\d+\s+THE\s+BEAUTIFUL[^\n]*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\n\s*THE\s+BEAUTIFUL[^\n]*\d+[^\n]*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\n\s*tHE\s+BEAUTIFUL[^\n]*\d+[^\n]*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\n\s*\d+\s+tHE\s+BEAUTIFUL[^\n]*', '', text, flags=re.IGNORECASE)
    # Join hyphenated line breaks
    text = re.sub(r'(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)', r'\1\2', text)
    # Remove leading scanner noise symbols at line starts
    text = re.sub(r'\n\s*[\^\\>flI|~*]+\s*', '\n', text)
    # Normalize multiple whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    return text.strip()


def parse_sundarkand(growse_path: str, devanagari_path: str) -> Dict[str, Any]:
    """Parse Sundar Kand (all 60 Dohas) into Shoonaya canonical manifest."""
    with open(growse_path, "r", encoding="utf-8", errors="ignore") as f:
        full_growse = f.read()

    pos_b5 = full_growse.find("BOOK  V.")
    pos_b6 = full_growse.find("BOOK  VI")
    if pos_b5 == -1 or pos_b6 == -1:
        raise ValueError("Could not find Book V markers in Growse raw text.")

    b5_text = full_growse[pos_b5:pos_b6]

    # Pre-clean known OCR substitutions for Doha headers
    clean_b5 = b5_text
    clean_b5 = re.sub(r'DohdU,', 'Doha 11.', clean_b5)
    clean_b5 = re.sub(r'Vohd\s*37\.', 'Doha 37.', clean_b5)
    clean_b5 = re.sub(r'DohdAQ\.', 'Doha 46.', clean_b5)
    clean_b5 = re.sub(r'Doha\s*\^9\.', 'Doha 49.', clean_b5)

    pattern = re.compile(r'(?:Doh[aáâd\^i]\s*(\d+)\.?)', re.IGNORECASE)
    doha_matches = []
    for m in pattern.finditer(clean_b5):
        num = int(m.group(1))
        if 1 <= num <= 60 and not any(x[0] == num for x in doha_matches):
            doha_matches.append((num, m.start(), m.end()))

    doha_matches.sort(key=lambda x: x[0])
    if len(doha_matches) != 60:
        raise ValueError(f"Expected 60 Dohas in Book V, found {len(doha_matches)}")

    unit_starts = [clean_b5.find("Sanskrit  Invocation.")]
    for i in range(1, 60):
        doha_i_end = doha_matches[i-1][2]
        next_doha_start = doha_matches[i][1]
        between = clean_b5[doha_i_end:next_doha_start]
        m_ch = re.search(r'(?:Chaup|Ghaup)[aáâd\^io]{1,3}\.?', between, re.IGNORECASE)
        if m_ch:
            ch_pos = doha_i_end + m_ch.start()
            unit_starts.append(ch_pos)
        else:
            unit_starts.append(doha_i_end)
    unit_starts.append(len(clean_b5))

    growse_units = {}
    for i in range(1, 61):
        u_raw = clean_b5[unit_starts[i-1]:unit_starts[i]]
        growse_units[i] = clean_growse_unit(u_raw)

    # Load Devanagari Awadhi JSON
    with open(devanagari_path, "r", encoding="utf-8") as f:
        deva_data = json.load(f)

    if len(deva_data) != 60:
        raise ValueError(f"Expected 60 entries in {devanagari_path}, found {len(deva_data)}")

    content_items = []
    for idx, item in enumerate(deva_data):
        doha_num = idx + 1
        ref = f"5.{doha_num}"
        raw_awadhi = item["content"].strip().replace("\r\n", "\n").replace("\r", "\n")

        # For Doha 1, prefix with Sanskrit Mangalacharan
        if doha_num == 1:
            full_original = f"{SUNDAR_MANGALACHARAN_SANSKRIT}\n\n{raw_awadhi}"
        else:
            full_original = raw_awadhi

        # IAST transliteration
        translit = sanscript.transliterate(full_original, sanscript.DEVANAGARI, sanscript.IAST)

        title_desc = SUNDARKAND_TITLES.get(doha_num, f"Doha {doha_num}")
        unit_title = f"Ramcharitmanas — Sundar Kand, Doha {doha_num}: {title_desc}"
        translation_text = growse_units[doha_num]

        content_items.append({
            "ref": ref,
            "kanda": 5,
            "doha": doha_num,
            "title": unit_title,
            "sanskrit": full_original,
            "transliteration": translit,
            "text": translation_text,
            "translation": translation_text,
            "source_class": "translation",
            "rights_status": "public_domain",
            "review_status": "source_audit_approved",
            "is_pramana_grade": True,
            "provenance": (
                f"Goswami Tulsidas Ramcharitmanas (16th c.), Sundar Kand, Doha {doha_num}. "
                f"English translation by Frederic Salmon Growse (1883), Book V (The Beautiful), Allahabad Govt Press. "
                f"Internet Archive rmyanaoftuls00tulauoft (Public Domain)."
            )
        })

    manifest = {
        "doc_id": "tulsidas_ramcharitmanas_sundara",
        "title": "Ramcharitmanas — Sundar Kand (Goswami Tulsidas)",
        "source_name": "Goswami Tulsidas Ramcharitmanas",
        "source_class": "translation",
        "tradition": "Sanatana Dharma",
        "rights_status": "public_domain",
        "review_status": "source_audit_approved",
        "is_pramana_grade": True,
        "is_live_in_app": True,
        "original_text_status": "canonical",
        "translation_status": "public_domain",
        "audio_status": "unavailable",
        "source_url": "https://archive.org/details/rmyanaoftuls00tulauoft",
        "source_owner": "Goswami Tulsidas (Awadhi, 16th c.); Frederic Salmon Growse translation (1883, Allahabad)",
        "revision_note": (
            "Canonical ingestion of Ramcharitmanas Sundar Kand (all 60 Dohas) per canonical-data-sourcing skill: "
            "verbatim Awadhi text in Devanagari, IAST transliteration, and F. S. Growse public domain English translation."
        ),
        "content": content_items
    }
    return manifest


def main():
    growse_path = "python/ai_pipeline/corpus/raw/growse_ramayana_raw.txt"
    devanagari_path = "python/ai_pipeline/corpus/raw/tulsidas_devanagari/sundarkanda.json"
    output_path = "python/ai_pipeline/corpus/manifests/tulsidas_ramcharitmanas_sundara.json"

    if not os.path.exists(growse_path):
        print(f"Error: Growse raw source not found at {growse_path}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(devanagari_path):
        print(f"Error: Devanagari raw source not found at {devanagari_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing Ramcharitmanas Sundar Kand from {devanagari_path} and {growse_path}...")
    manifest = parse_sundarkand(growse_path, devanagari_path)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {output_path} with {len(manifest['content'])} entries!")


if __name__ == "__main__":
    main()
