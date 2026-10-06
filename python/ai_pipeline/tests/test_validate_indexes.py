"""Tests for the corpus index validator.

Run: PYTHONPATH=python/ai_pipeline/src python3 -m unittest discover -s python/ai_pipeline/tests
"""

import json
import math
import tempfile
import unittest
from pathlib import Path

from ai_pipeline.embeddings.validate_indexes import check_parity, detect_format, validate_index


def unit(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    return [value / norm for value in vector]


def sparse_index(ids: list[str]) -> dict:
    return {
        "idf": {"karma": 1.2},
        "documents": [{"id": doc_id, "ref": doc_id.split("_")[-1], "vector": {"karma": 0.5}} for doc_id in ids],
    }


def dense_index(ids: list[str], dim: int = 3) -> dict:
    return {
        "metadata": {"embedding_model": "test-model", "embedding_dim": dim, "document_count": len(ids)},
        "documents": [{"id": doc_id, "ref": doc_id.split("_")[-1], "vector": unit([1.0] * dim)} for doc_id in ids],
    }


class ValidateIndexTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def write(self, name: str, data: dict) -> Path:
        path = self.dir / name
        path.write_text(json.dumps(data), encoding="utf-8")
        return path

    def test_detects_both_formats(self) -> None:
        self.assertEqual(detect_format(sparse_index(["gita_1.1"])), "sparse")
        self.assertEqual(detect_format(dense_index(["gita_1.1"])), "dense")

    def test_valid_sparse_index_passes(self) -> None:
        result = validate_index("gita", self.write("s.json", sparse_index(["gita_1.1", "gita_1.2"])))
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual(result["format"], "sparse")

    def test_valid_dense_index_passes_without_idf(self) -> None:
        result = validate_index("gita", self.write("d.json", dense_index(["gita_1.1", "gita_1.2"])))
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual(result["format"], "dense")
        self.assertEqual(result["embedding_dim"], 3)

    def test_dense_dimension_mismatch_fails(self) -> None:
        data = dense_index(["gita_1.1", "gita_1.2"])
        data["documents"][1]["vector"] = unit([1.0, 2.0])
        result = validate_index("gita", self.write("d.json", data))
        self.assertFalse(result["valid"])
        self.assertTrue(any("2 dims, expected 3" in error for error in result["errors"]))

    def test_dense_non_normalised_vector_fails(self) -> None:
        data = dense_index(["gita_1.1"])
        data["documents"][0]["vector"] = [1.0, 1.0, 1.0]
        result = validate_index("gita", self.write("d.json", data))
        self.assertFalse(result["valid"])
        self.assertTrue(any("not unit-normalised" in error for error in result["errors"]))

    def test_dense_non_finite_value_fails(self) -> None:
        data = dense_index(["gita_1.1"])
        data["documents"][0]["vector"] = [float("nan"), 0.0, 0.0]
        path = self.dir / "d.json"
        path.write_text(json.dumps(data), encoding="utf-8")  # json writes NaN, which json.load accepts
        result = validate_index("gita", path)
        self.assertFalse(result["valid"])
        self.assertTrue(any("non-finite" in error for error in result["errors"]))

    def test_dense_requires_model_and_dimension_metadata(self) -> None:
        data = dense_index(["gita_1.1"])
        data["metadata"] = {}
        result = validate_index("gita", self.write("d.json", data))
        self.assertFalse(result["valid"])
        self.assertTrue(any("embedding_dim" in error for error in result["errors"]))
        self.assertTrue(any("embedding_model" in error for error in result["errors"]))

    def test_duplicate_ids_fail_with_exact_count(self) -> None:
        result = validate_index("katha", self.write("s.json", sparse_index(["katha_2.2", "katha_2.2", "katha_2.2", "katha_2.3"])))
        self.assertFalse(result["valid"])
        self.assertEqual(result["duplicate_ids"], ["katha_2.2"])
        self.assertTrue(any("1 document ids are shared by 3 documents" in error for error in result["errors"]))

    def test_metadata_document_count_mismatch_fails(self) -> None:
        data = dense_index(["gita_1.1", "gita_1.2"])
        data["metadata"]["document_count"] = 5
        result = validate_index("gita", self.write("d.json", data))
        self.assertFalse(result["valid"])

    def test_missing_file_is_reported(self) -> None:
        result = validate_index("gita", self.dir / "absent.json")
        self.assertFalse(result["exists"])
        self.assertFalse(result["valid"])

    def test_parity_passes_for_identical_coverage(self) -> None:
        sparse = validate_index("gita", self.write("s.json", sparse_index(["gita_1.1", "gita_1.2"])))
        dense = validate_index("gita", self.write("d.json", dense_index(["gita_1.1", "gita_1.2"])))
        self.assertEqual(check_parity(sparse, dense), [])

    def test_parity_reports_dropped_and_extra_documents(self) -> None:
        sparse = validate_index("gita", self.write("s.json", sparse_index(["gita_1.1", "gita_1.2"])))
        dense = validate_index("gita", self.write("d.json", dense_index(["gita_1.1", "gita_9.9"])))
        errors = check_parity(sparse, dense)
        self.assertTrue(any("missing 1 ids" in error and "gita_1.2" in error for error in errors))
        self.assertTrue(any("1 ids absent" in error and "gita_9.9" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
