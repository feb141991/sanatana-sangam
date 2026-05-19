from __future__ import annotations

import json
import re
from typing import Any


def score_katha_explain(result: dict[str, Any], case: dict[str, Any]) -> dict[str, Any]:
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

    # 2. Figure/Theme Match
    figure_theme_match = False
    if parsed_json:
        combined_text = " ".join([str(val).lower() for val in parsed_json.values()])
        expected_keywords = []
        if "prahlada" in story_title.lower() or "prahlada" in case_id:
            expected_keywords = ["prahlada", "narasimha", "vishnu", "demon", "प्रहलाद", "नरसिंह", "विष्णु"]
        elif "dhruva" in story_title.lower() or "dhruva" in case_id:
            expected_keywords = ["dhruva", "tapasya", "vishnu", "star", "ध्रुव", "तपस्या", "तप", "तारा"]
        elif "sudama" in story_title.lower() or "sudama" in case_id:
            expected_keywords = ["sudama", "krishna", "rice", "poha", "poverty", "सुदामा", "कृष्ण", "चावल"]
        elif "gajendra" in story_title.lower() or "gajendra" in case_id:
            expected_keywords = ["gajendra", "crocodile", "vishnu", "lotus", "moksha", "गजेंद्र", "मगरमच्छ", "मोक्ष"]
        
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
            # For Hindi, if the figure match passed, we are grounded in the story
            grounding_present = True
        elif len(parsed_json.get("meaning", "")) > 10:
            grounding_present = True

    # 4. Lesson Extraction Quality
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
