from __future__ import annotations


def choose_model(feature: str) -> str:
    mapping = {
        "pathshala_explain": "sarvam-30b",
        "meaning_generate": "indictrans2",
    }
    return mapping.get(feature, "sarvam-30b")
