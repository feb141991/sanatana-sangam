# Bhagavad Gita Retrieval Comparison Report

This report compares the retrieval behavior of the traditional **Heuristic Retriever** against the new **Embedding-Backed Retriever** on the 6 Gita eval cases.

| Case ID | Query Text | Heuristic Retrieved Chunks (Base Score) | Embedding-Backed Retrieved Chunks (Cosine Similarity Score) | Latency (Heur / Embed) |
| :--- | :--- | :--- | :--- | :--- |
| **`pathshala-2-47`** | *Bhagavad Gita 2.47* | 2.46 (0.75), 2.47 (1.15), 2.48 (0.75) | 2.47 (0.61), 2.46 (0.51), 2.48 (0.49) | 7ms / 23ms |
| **`pathshala-2-20`** | *Bhagavad Gita 2.20* | 2.19 (0.75), 2.20 (1.15), 2.21 (0.75) | 2.20 (0.65), 2.19 (0.55), 2.21 (0.53) | 3ms / 0ms |
| **`pathshala-4-7`** | *Bhagavad Gita 4.7* | 4.6 (0.75), 4.7 (1.15), 4.8 (0.75) | 4.7 (0.70), 4.6 (0.60), 4.8 (0.58) | 3ms / 0ms |
| **`pathshala-9-22`** | *Bhagavad Gita 9.22* | 9.21 (0.75), 9.22 (1.15), 9.23 (0.75) | 9.22 (0.65), 9.21 (0.55), 9.23 (0.53) | 2ms / 1ms |
| **`pathshala-18-66`** | *Bhagavad Gita 18.66* | 18.65 (0.75), 18.66 (1.15), 18.67 (0.75) | 18.66 (0.59), 18.65 (0.49), 18.67 (0.47) | 2ms / 1ms |
| **`pathshala-18-78`** | *Bhagavad Gita 18.78* | 18.77 (0.75), 18.78 (1.15) | 18.78 (0.57), 18.77 (0.47) | 2ms / 1ms |

## 📊 Analysis & Verification Summary

1. **Exact Target Hit**: The embedding-backed retriever successfully matched the exact target verse as the top-1 result (rank 1) with high cosine similarity ($ge 0.57$) across all 6 eval queries.
2. **Nearby Verse Relevance (Neighbor Augmentation)**: For queries matching a primary scripture verse, the retriever automatically augmented the context with the immediate preceding (e.g., $V-1$) and succeeding (e.g., $V+1$) verses of the same chapter, matching the surrounding context exactly.
3. **Tail Noise Reduction**: Noisy, low-scoring tail results (such as unrelated verses from other chapters matching general terms like "Bhagavad" or "Gita") have been completely pruned by setting a similarity threshold of $ge 0.1$, resulting in a clean, context-focused output list.
