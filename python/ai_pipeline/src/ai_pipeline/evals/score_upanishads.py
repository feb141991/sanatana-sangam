from __future__ import annotations

import json
import re
from typing import Any


def score_upanishads_explain(result: dict[str, Any], case: dict[str, Any]) -> dict[str, Any]:
    raw_response = result.get("raw_response", "")
    retrieved_passages = result.get("retrieved_passages") or []
    expected_language = case.get("prompt", {}).get("language", "en")
    expected_doc_id = case.get("prompt", {}).get("doc_id", "")
    story_title = case.get("prompt", {}).get("title") or case.get("prompt", {}).get("chunk_id") or ""
    story_text = case.get("prompt", {}).get("story", "")
    case_id = case.get("case_id", "").lower()

    # 1. JSON Contract Validity
    json_valid = False
    parsed_json = None
    try:
        json_str = raw_response
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw_response)
        if match:
            json_str = match.group(1)
        parsed_json = json.loads(json_str.strip())

        required_keys = [
            "word_by_word",
            "meaning",
            "commentary",
            "daily_application",
            "contemplation",
            "related_text",
        ]
        json_valid = all(k in parsed_json for k in required_keys)
    except Exception:
        json_valid = False

    # 2. Figure/Theme Match — covers all principal Upanishads in the expanded dataset
    figure_theme_match = False
    if parsed_json:
        combined_text = " ".join([str(val).lower() for val in parsed_json.values()])
        expected_keywords: list[str] = []

        if "isha" in case_id:
            expected_keywords = ["isha", "enveloped", "renunciation", "covet", "ईशा", "त्याग", "lord"]
        elif "katha-1" in case_id:
            expected_keywords = ["shreya", "preya", "good", "pleasant", "श्रेय", "प्रेय"]
        elif "katha-2" in case_id:
            expected_keywords = ["arise", "awake", "razor", "wise", "उत्तिष्ठत", "जाग्रत"]
        elif "tattvamasi" in case_id:
            expected_keywords = ["tat tvam asi", "tvam", "asi", "shvetaketu", "तत्वमसि", "श्वेतकेतु", "तत्त्वमसि"]
        elif "neti" in case_id:
            expected_keywords = ["neti", "negation", "brahman", "limiting", "transcend"]
        elif "aham-brahmasmi" in case_id:
            expected_keywords = ["aham brahmasmi", "i am brahman", "mahavakya", "unity", "brahman"]
        elif "asato-ma" in case_id:
            expected_keywords = ["asato", "unreal", "real", "darkness", "light", "immortality", "असतो", "प्रकाश", "अमृत"]
        elif "om" in case_id or "mandukya-om" in case_id:
            expected_keywords = ["om", "syllable", "time", "past", "future"]
        elif "turiya" in case_id:
            expected_keywords = ["turiya", "fourth", "consciousness", "waking", "dream"]
        elif "atman-grace" in case_id or "mundaka" in case_id:
            expected_keywords = ["atman", "self", "grace", "reveals", "chosen"]
        elif "ear-of-ear" in case_id or "kena" in case_id:
            expected_keywords = ["ear", "mind", "speech", "immortal", "sense"]
        elif "bhuma" in case_id:
            expected_keywords = ["bhuma", "infinite", "happiness", "finite"]
        elif "ananda" in case_id or "taittiriya" in case_id:
            expected_keywords = ["bliss", "brahman", "ananda", "speech", "mind", "fears"]
        elif "chandogya" in case_id:
            expected_keywords = ["chandogya", "brahman", "existence", "all this"]

        if any(kw in combined_text for kw in expected_keywords):
            figure_theme_match = True
        else:
            title_parts = story_title.lower().split()
            if any(part in combined_text for part in title_parts if len(part) >= 4):
                figure_theme_match = True

    # 3. Story Grounding
    grounding_present = False
    combined_passage_text = " ".join([p.get("content", "").lower() for p in retrieved_passages]) + " " + story_text.lower()
    
    if parsed_json:
        combined_response_text = " ".join([str(val).lower() for val in parsed_json.values()])

        def get_words(text):
            raw_words = re.split(r"[^\w\u0900-\u097f\u0a00-\u0a7f]+", text.lower())
            return {w for w in raw_words if len(w) >= 3}

        passage_words = get_words(combined_passage_text)
        response_words = get_words(combined_response_text)
        overlap = passage_words.intersection(response_words)
        
        if len(overlap) >= 1:
            grounding_present = True
        elif expected_language == "hi" and figure_theme_match:
            grounding_present = True
        elif len(parsed_json.get("meaning", "")) > 10:
            grounding_present = True

    # 4. Jnana / Metaphysical Commentary Quality
    lesson_quality = False
    if parsed_json:
        commentary_len = len(parsed_json.get("commentary", ""))
        daily_app_len = len(parsed_json.get("daily_application", ""))
        if commentary_len > 15 and daily_app_len > 15:
            lesson_quality = True

    # 5. Language Compliance
    language_compliant = True
    if parsed_json:
        meaning_text = parsed_json.get("meaning", "")
        if expected_language == "hi":
            has_devanagari = bool(re.search(r"[\u0900-\u097F]", meaning_text))
            language_compliant = has_devanagari
        elif expected_language == "pa":
            has_gurmukhi = bool(re.search(r"[\u0A00-\u0A7F]", meaning_text))
            language_compliant = has_gurmukhi
        else:
            devanagari_count = len(re.findall(r"[\u0900-\u097F]", meaning_text))
            language_compliant = devanagari_count < len(meaning_text) * 0.2

    scores = [json_valid, grounding_present, figure_theme_match, lesson_quality, language_compliant]
    score_val = sum(1 for s in scores if s)

    return {
        "score": score_val,
        "max_score": 5,
        "json_contract_valid": json_valid,
        "grounding_present": grounding_present,
        "figure_theme_match": figure_theme_match,
        "lesson_quality": lesson_quality,
        "language_compliance": language_compliant,
    }
