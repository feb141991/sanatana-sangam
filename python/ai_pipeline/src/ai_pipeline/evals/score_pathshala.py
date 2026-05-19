from __future__ import annotations

import json
import re
from typing import Any


def score_pathshala_explain(result: dict[str, Any], case: dict[str, Any]) -> dict[str, Any]:
    raw_response = result.get("raw_response", "")
    retrieved_passages = result.get("retrieved_passages") or []
    expected_language = case.get("prompt", {}).get("language", "en")
    expected_doc_id = case.get("prompt", {}).get("doc_id", "")

    # 1. JSON Contract Valid
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

    # 2. Grounding Present
    grounding_present = False
    if parsed_json and retrieved_passages:
        combined_passage_text = " ".join([p.get("content", "").lower() for p in retrieved_passages])
        combined_response_text = " ".join([str(val).lower() for val in parsed_json.values()])

        def get_words(text):
            raw_words = re.split(r"[^\w\u0900-\u097f\u0a00-\u0a7f]+", text.lower())
            return {w for w in raw_words if len(w) >= 3}

        passage_words = get_words(combined_passage_text)
        response_words = get_words(combined_response_text)
        overlap = passage_words.intersection(response_words)
        grounding_present = len(overlap) >= 2
    elif parsed_json:
        grounding_present = len(parsed_json.get("meaning", "")) > 10

    # 3. Source Metadata Present
    source_metadata_present = False
    if parsed_json:
        combined_text = " ".join([str(val) for val in parsed_json.values()])
        chunk_id = case.get("prompt", {}).get("chunk_id", "")
        # Check if the specific verse ref (like 18.66 or 2.47) is mentioned, or "gita" is present
        if chunk_id and (chunk_id in combined_text or chunk_id.replace(".", ":") in combined_text):
            source_metadata_present = True
        elif "gita" in combined_text.lower() or "bhagavad" in combined_text.lower():
            source_metadata_present = True
        else:
            doc_parts = expected_doc_id.split("_")
            if len(doc_parts) >= 3:
                chapter = doc_parts[1]
                verse = doc_parts[2]
                ref_pattern = rf"{chapter}[.:]{verse}"
                if re.search(ref_pattern, combined_text):
                    source_metadata_present = True

    # 4. Language Compliance
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

    scores = [grounding_present, source_metadata_present, json_valid, language_compliant]
    score_val = sum(1 for s in scores if s)

    return {
        "score": score_val,
        "max_score": 4,
        "json_contract_valid": json_valid,
        "grounding_present": grounding_present,
        "source_metadata_present": source_metadata_present,
        "language_compliance": language_compliant,
    }
