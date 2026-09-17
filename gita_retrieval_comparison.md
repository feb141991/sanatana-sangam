# Bhagavad Gita Retrieval Comparison Report

This report compares the traditional **Heuristic Retriever**, the sparse TF-IDF **Embedding-Backed Retriever**, and the new **Dense (real neural embedding) Retriever** on the 6 Gita eval cases.

> **Caveat on the Dense column below**: these 6 cases construct the query as a bare reference string (`Bhagavad Gita 2.47`, no verse content). That is a fair test for the *sparse* retriever, whose doc-time index deliberately repeats the reference tokens 10x specifically so a bare-reference query matches by shared vocabulary. It is **not** a fair test of dense retrieval quality: a sentence embedding model has no way to distinguish "2.47" from "2.20" from a bare number with no semantic content, so the Dense column below tends to converge on whichever verses happen to be generically closest to "a Bhagavad Gita verse reference" (observed: chapter 4 verses 20-22 dominate almost every row here) rather than the cited verse. This is expected, not a bug -- exact-citation lookup should stay on direct manifest/ID lookup (already available via the heuristic retriever) regardless of whether dense embeddings ship; dense embeddings target natural-language queries, tested properly in the Paraphrase Queries section below.

| Case ID | Query Text | Heuristic Retrieved Chunks (Base Score) | Sparse Retrieved Chunks (Cosine) | Dense Retrieved Chunks (Cosine) | Latency (Heur / Sparse / Dense) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`pathshala-2-47`** | *Bhagavad Gita 2.47* | 2.46 (1.60), 2.47 (2.00), 2.48 (1.60) | 2.47 (0.61), 2.46 (0.51), 2.48 (0.49) | 4.21 (0.72), 4.20 (0.62), 4.22 (0.60), 6.14 (0.69), 2.63 (0.68) | 6ms / 37ms / 442ms |
| **`pathshala-2-20`** | *Bhagavad Gita 2.20* | 2.19 (1.60), 2.20 (2.00), 2.21 (1.60) | 2.20 (0.65), 2.19 (0.55), 2.21 (0.53) | 4.21 (0.71), 4.20 (0.61), 4.22 (0.59), 6.14 (0.68), 18.18 (0.66) | 3ms / 2ms / 7ms |
| **`pathshala-4-7`** | *Bhagavad Gita 4.7* | 4.6 (1.60), 4.7 (2.00), 4.8 (1.60) | 4.7 (0.70), 4.6 (0.60), 4.8 (0.58) | 4.21 (0.74), 4.20 (0.64), 4.22 (0.62), 6.14 (0.70), 4.23 (0.69) | 2ms / 1ms / 12ms |
| **`pathshala-9-22`** | *Bhagavad Gita 9.22* | 9.21 (1.60), 9.22 (2.00), 9.23 (1.60) | 9.22 (0.65), 9.21 (0.55), 9.23 (0.53) | 4.21 (0.70), 4.20 (0.60), 4.22 (0.58), 9.30 (0.68), 9.11 (0.68) | 2ms / 2ms / 7ms |
| **`pathshala-18-66`** | *Bhagavad Gita 18.66* | 18.65 (1.60), 18.66 (2.00), 18.67 (1.60) | 18.66 (0.59), 18.65 (0.49), 18.67 (0.47) | 18.18 (0.69), 18.17 (0.59), 18.19 (0.57), 4.21 (0.69), 4.8 (0.67) | 3ms / 1ms / 7ms |
| **`pathshala-18-78`** | *Bhagavad Gita 18.78* | 18.77 (1.60), 18.78 (2.00) | 18.78 (0.57), 18.77 (0.47) | 4.21 (0.67), 4.20 (0.57), 4.22 (0.55), 4.8 (0.66), 18.18 (0.65) | 2ms / 1ms / 7ms |

## 🔍 Paraphrase Queries (TF-IDF weak spot)

These queries deliberately share little vocabulary with the target verse's actual text. Reported as the target chunk's rank/score within the top-5 results (or "not in top-5"), not a strict pass/fail, since a vague paraphrase does not always resolve to one unambiguous "correct" verse.

| Case ID | Query | Expected Chunk | Sparse Rank (Score) | Dense Rank (Score) |
| :--- | :--- | :--- | :--- | :--- |
| **`paraphrase-action-fruits`** | *action and its fruits* | `2.47` | not in top-5 | 5 (0.54) |
| **`paraphrase-soul-indestructible`** | *the soul cannot be cut by weapons or burned by fire* | `2.23` | not in top-5 | not in top-5 |
| **`paraphrase-surrender`** | *give up everything and surrender to God, who will liberate you* | `18.66` | not in top-5 | 1 (0.54) |
| **`paraphrase-avatar`** | *whenever righteousness declines, the divine takes birth to restore it* | `4.7` | 1 (0.06) | not in top-5 |

## 📊 Analysis & Verification Summary

1. **Exact Target Hit (exact-reference cases)**: The sparse embedding-backed retriever matched the exact target verse as the top-1 result across the 6 eval queries above, which construct their query text directly from the chunk reference (e.g. `Bhagavad Gita 2.47`) -- an easy case for TF-IDF, since the reference tokens themselves are highly discriminating.
2. **Nearby Verse Relevance (Neighbor Augmentation)**: For queries matching a primary scripture verse, the retriever automatically augmented the context with the immediate preceding and succeeding verses of the same chapter.
3. **Paraphrase queries**: see the table above for per-case rank/score of the expected verse under both retrievers -- this is where sparse TF-IDF and dense embeddings are expected to diverge, since paraphrases by design share little vocabulary with the target verse.
