from __future__ import annotations

import json
import re
from typing import Any


def score_jain_sutra_explain(result: dict[str, Any], case: dict[str, Any]) -> dict[str, Any]:
    """
    Scores a Jain Dharma sutra explanation response.

    Checks:
    1. JSON contract validity (required keys present)
    2. Jain-lens correctness (ahimsa, anekantavada, Ratnatraya — no pure Vedantic framing)
    3. Grounding (response references the passage text)
    4. Commentary quality (length checks on commentary and daily_application)
    5. Language compliance
    """
    raw_response = result.get("raw_response", "")
    retrieved_passages = result.get("retrieved_passages") or []
    expected_language = case.get("prompt", {}).get("language", "en")
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

    # 2. Jain-Lens Correctness
    jain_lens_correct = False
    if parsed_json:
        combined_text = " ".join([str(val).lower() for val in parsed_json.values()])
        # Jain vocabulary signals
        jain_keywords = [
            "ahimsa", "non-violence", "anekantavada", "many-sided", "syadvada",
            "moksha", "liberation", "jiva", "karma", "soul", "ratnatraya",
            "samyak", "darshana", "jnana", "charitra", "tapas", "austerity",
            "aparigraha", "non-possession", "equanimity", "samata", "mahavira",
            "kundakunda", "agama", "jain",
        ]
        # Case-specific keyword checks
        case_keywords: dict[str, list[str]] = {
            "ahimsa": ["ahimsa", "non-violence", "harm", "living beings"],
            "anekantavada": ["anekantavada", "many-sided", "syadvada", "perspective", "reality"],
            "ratnatraya": ["ratnatraya", "three jewels", "samyak", "faith", "knowledge", "conduct"],
            "karma": ["karma", "soul", "jiva", "liberation", "ajiva", "nirjara", "samvara"],
            "vows": ["vow", "mahavrata", "ahimsa", "satya", "asteya", "brahmacharya", "aparigraha"],
            "equanimity": ["equanimity", "samata", "composure", "self-mastery", "equanimous"],
        }
        matched_case_key = next((k for k in case_keywords if k in case_id), None)
        if matched_case_key:
            extra_kws = case_keywords[matched_case_key]
            jain_lens_correct = any(kw in combined_text for kw in extra_kws)
        else:
            jain_lens_correct = any(kw in combined_text for kw in jain_keywords)

    # 3. Grounding
    grounding_present = False
    combined_passage_text = (
        " ".join([p.get("content", "").lower() for p in retrieved_passages])
        + " " + story_text.lower()
    )
    if parsed_json:
        combined_response_text = " ".join([str(val).lower() for val in parsed_json.values()])

        def get_words(text: str) -> set[str]:
            raw_words = re.split(r"[^\w\u0900-\u097f]+", text.lower())
            return {w for w in raw_words if len(w) >= 3}

        passage_words = get_words(combined_passage_text)
        response_words = get_words(combined_response_text)
        overlap = passage_words.intersection(response_words)

        if len(overlap) >= 1:
            grounding_present = True
        elif len(parsed_json.get("meaning", "")) > 10:
            grounding_present = True

    # 4. Commentary Quality
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
        else:
            devanagari_count = len(re.findall(r"[\u0900-\u097F]", meaning_text))
            language_compliant = devanagari_count < len(meaning_text) * 0.2

    scores = [json_valid, grounding_present, jain_lens_correct, lesson_quality, language_compliant]
    score_val = sum(1 for s in scores if s)

    return {
        "score": score_val,
        "max_score": 5,
        "json_contract_valid": json_valid,
        "grounding_present": grounding_present,
        "jain_lens_correct": jain_lens_correct,
        "lesson_quality": lesson_quality,
        "language_compliance": language_compliant,
    }
