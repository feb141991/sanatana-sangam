"""Citation integrity for the Katha and Mundaka Upanishad manifests.

Both texts use three-level citations (Katha adhyaya.valli.verse, Mundaka
mundaka.khanda.verse). These checks pin the canonical section sizes, unique
refs, well-known verses at their traditional refs, and the absence of OCR page
furniture, so a re-split cannot silently reintroduce wrong citations.

Run: PYTHONPATH=python/ai_pipeline/src python3 -m unittest discover -s python/ai_pipeline/tests
"""

import collections
import json
import re
import unittest
from pathlib import Path

from ai_pipeline.corpus.expand_upanishads_manifests import KATHA_SECTIONS, MUNDAKA_SECTIONS

MANIFESTS = Path(__file__).resolve().parents[1] / "corpus" / "manifests"

# Opening words of well-known verses in Hume (1921), at their traditional refs.
KATHA_LANDMARKS = {
    "1.1.1": "Vajasravasa",
    "1.2.1": "The better",
    "1.2.18": "is not born, nor dies",
    "1.2.23": "not to be obtained by instruction",
    "1.3.3": "riding in a chariot",
    "1.3.14": "Arise ye",
    "2.1.1": "The Self-existent",
    "2.3.1": "Its root is above",
    "2.3.18": "Then Naciketas",
}
MUNDAKA_LANDMARKS = {
    "1.1.1": "Brahma arose as the first of the gods",
    "2.1.1": "sparks",
    "2.2.4": "is the bow",
    "3.1.1": "Two birds",
    "3.1.6": "Truth alone conquers",
    "3.2.3": "not to be obtained by instruction",
    "3.2.9": "supreme Brahma",
}
NOISE = re.compile(r"UPANISHAD|UPAXISHAD|VALLI|MUNDAKA|Khanda|Rwanda|\bCf\.|\bRV\.|(?<![\d.])\d{1,2}(?![\d.])")


def load(name: str) -> list[dict]:
    with open(MANIFESTS / name, encoding="utf-8") as f:
        return json.load(f)["content"]


class ThreeLevelManifestTest(unittest.TestCase):
    def check(self, filename: str, sections: list[tuple[int, int, int]], landmarks: dict[str, str]) -> None:
        content = load(filename)
        refs = [entry["ref"] for entry in content]
        self.assertEqual(len(refs), len(set(refs)), f"{filename}: duplicate refs")
        self.assertTrue(all(re.fullmatch(r"\d+\.\d+\.\d+", ref) for ref in refs), f"{filename}: every ref must be three-level")

        per_section = collections.Counter(tuple(int(part) for part in ref.split(".")[:2]) for ref in refs)
        for major, minor, count in sections:
            self.assertEqual(per_section[(major, minor)], count, f"{filename} {major}.{minor} verse count")
            expected = [f"{major}.{minor}.{n}" for n in range(1, count + 1)]
            self.assertEqual([r for r in refs if r.startswith(f"{major}.{minor}.")], expected, f"{filename} {major}.{minor} order")

        by_ref = {entry["ref"]: re.sub(r"\s+", " ", entry["text"]) for entry in content}
        for ref, opening in landmarks.items():
            self.assertIn(opening.lower(), by_ref[ref].lower(), f"{filename} {ref} should contain '{opening}'")

        for entry in content:
            self.assertGreaterEqual(len(entry["text"]), 20, f"{filename} {entry['ref']} text too short")
            self.assertIsNone(NOISE.search(entry["text"]), f"{filename} {entry['ref']} contains OCR/footnote residue")

    def test_katha(self) -> None:
        self.check("upanishad_katha.json", KATHA_SECTIONS, KATHA_LANDMARKS)

    def test_mundaka(self) -> None:
        self.check("upanishad_mundaka.json", MUNDAKA_SECTIONS, MUNDAKA_LANDMARKS)

    def test_every_verse_carries_its_own_sanskrit_from_the_recorded_source(self) -> None:
        # Sanskrit openings of well-known verses, checked against each verse's ref.
        expected_openings = {
            "upanishad_katha.json": {"1.2.1": "अन्यच्छ्रेयो", "1.2.18": "न जायते", "1.2.23": "नायमात्मा प्रवचनेन", "1.3.3": "आत्मानं", "1.3.14": "उत्तिष्ठत", "2.1.1": "पराञ्चि खानि", "2.3.1": "ऊर्ध्वमूलो"},
            "upanishad_mundaka.json": {"1.1.1": "ब्रह्मा देवानां", "2.2.4": "प्रणवो धनुः", "3.1.1": "द्वा सुपर्णा", "3.1.6": "सत्यमेव जयते", "3.2.8": "यथा नद्यः"},
        }
        for filename, openings in expected_openings.items():
            with open(MANIFESTS / filename, encoding="utf-8") as f:
                manifest = json.load(f)
            self.assertIn("Vedic Heritage Portal", manifest.get("sanskrit_source", ""), f"{filename} must record its Sanskrit source")
            sanskrit = {entry["ref"]: entry.get("sanskrit", "") for entry in manifest["content"]}
            self.assertTrue(all(sanskrit.values()), f"{filename}: every verse needs Sanskrit")
            for text in sanskrit.values():
                self.assertFalse(text.startswith("॥"), f"{filename}: section heading left in Sanskrit")
                self.assertNotRegex(text, r"खण्डः|वल्ली|ॐ शान्तिः", f"{filename}: colophon or peace chant left in Sanskrit")
            for ref, opening in openings.items():
                self.assertTrue(sanskrit[ref].startswith(opening), f"{filename} {ref} Sanskrit should open with {opening}")

        katha = {entry["ref"]: entry for entry in load("upanishad_katha.json")}
        self.assertEqual(sorted(ref for ref, entry in katha.items() if entry.get("transliteration")), ["1.2.1", "1.3.14"])

    def test_known_ocr_errors_are_corrected(self) -> None:
        texts = " ".join(entry["text"] for name in ("upanishad_katha.json", "upanishad_mundaka.json") for entry in load(name))
        for garbled in ("oceap", "sfynes", "/apas", "d/man", "HeTisj", "larka", "a-jianda", "{", "}", "founda-\ntion"):
            self.assertNotIn(garbled, texts)
        by_ref = {entry["ref"]: re.sub(r"\s+", " ", entry["text"]) for entry in load("upanishad_mundaka.json")}
        self.assertIn("The arrow is the soul (atman)", by_ref["2.2.4"])
        self.assertIn("the flowing rivers in the ocean", by_ref["3.2.8"])


if __name__ == "__main__":
    unittest.main()
