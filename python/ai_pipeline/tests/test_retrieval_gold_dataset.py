"""Integrity checks for the retrieval-quality gold dataset.

Every expected id must exist exactly once in its corpus index, so a re-index
that renames, drops or duplicates a passage fails here instead of silently
turning a correct retrieval into a reported miss.

Run: PYTHONPATH=python/ai_pipeline/src python3 -m unittest discover -s python/ai_pipeline/tests
"""

import collections
import json
import unittest
from pathlib import Path

PIPELINE = Path(__file__).resolve().parents[1]
DATASET = PIPELINE / "datasets" / "evals" / "retrieval_quality.gold.jsonl"
CORPUS_INDEXES = {
    "pathshala_gita": PIPELINE / "corpus" / "gita_index_dense.json",
    "pathshala_upanishads": PIPELINE / "corpus" / "upanishads_index_dense.json",
}
REQUIRED_FIELDS = {"case_id", "corpus", "query", "expected_ids", "kind", "verified"}
LANGUAGES = {"en", "hi", "pa", "hi-latn"}


def load_cases() -> list[dict]:
    with open(DATASET, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def id_counts(index_path: Path) -> collections.Counter:
    with open(index_path, encoding="utf-8") as f:
        return collections.Counter(doc["id"] for doc in json.load(f)["documents"])


class RetrievalGoldDatasetTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cases = load_cases()
        cls.counts = {corpus: id_counts(path) for corpus, path in CORPUS_INDEXES.items()}

    def test_cases_are_well_formed_and_unique(self) -> None:
        self.assertGreater(len(self.cases), 0)
        case_ids = [case["case_id"] for case in self.cases]
        self.assertEqual(len(case_ids), len(set(case_ids)), "case_id values must be unique")
        for case in self.cases:
            self.assertTrue(REQUIRED_FIELDS <= case.keys(), f"{case.get('case_id')} is missing fields")
            self.assertIn(case["corpus"], CORPUS_INDEXES, f"{case['case_id']} names an unknown corpus")
            self.assertTrue(case["query"].strip(), f"{case['case_id']} has an empty query")
            self.assertTrue(case["expected_ids"], f"{case['case_id']} has no expected ids")
            self.assertIn(case.get("language", "en"), LANGUAGES, f"{case['case_id']} has an unknown language")

    def test_every_expected_id_exists_exactly_once_in_its_index(self) -> None:
        for case in self.cases:
            counts = self.counts[case["corpus"]]
            for expected_id in case["expected_ids"]:
                self.assertEqual(
                    counts.get(expected_id, 0), 1,
                    f"{case['case_id']}: {expected_id} appears {counts.get(expected_id, 0)} times in {case['corpus']}",
                )


if __name__ == "__main__":
    unittest.main()
