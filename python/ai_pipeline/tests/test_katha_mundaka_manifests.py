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

    def test_sanskrit_is_attached_only_where_the_source_markers_identify_the_verse(self) -> None:
        sanskrit = {entry["ref"]: entry["sanskrit"] for entry in load("upanishad_katha.json") if entry.get("sanskrit")}
        self.assertEqual(sorted(sanskrit), ["1.2.1", "1.3.14"])
        self.assertTrue(sanskrit["1.2.1"].startswith("अन्यच्छ्रेयो"))
        self.assertTrue(sanskrit["1.3.14"].startswith("उत्तिष्ठत"))
        self.assertFalse(any(entry.get("sanskrit") for entry in load("upanishad_mundaka.json")))


if __name__ == "__main__":
    unittest.main()
