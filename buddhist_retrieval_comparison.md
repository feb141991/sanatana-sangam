# Buddhist Dhamma Retrieval Comparison Report

This report compares the retrieval behavior of the traditional **Heuristic Retriever** against the new **Embedding-Backed Retriever** on the Buddhist Dhamma eval cases.

| Case ID | Query Text | Heuristic Retrieved Chunks (Base Score) | Embedding-Backed Retrieved Chunks (Cosine Similarity Score) | Latency (Heur / Embed) |
| :--- | :--- | :--- | :--- | :--- |
| **`buddhist-dhamma-dukkha`** | *Buddhist Dhamma 1.1* | 1.1 (1.40), 1.2 (1.00) | 1.1 (0.64), 1.2 (0.52), 2.1 (0.20), 1.4 (0.20), 1.3 (0.19) | 0ms / 1ms |
| **`buddhist-dhamma-anatta`** | *Buddhist Dhamma 1.2* | 1.1 (1.00), 1.2 (1.40), 1.3 (1.00) | 1.2 (0.73), 1.1 (0.63), 1.3 (0.61), 2.1 (0.20), 1.4 (0.20) | 0ms / 0ms |
| **`buddhist-dhamma-dependent-origination`** | *Buddhist Dhamma 1.3* | 1.2 (1.00), 1.3 (1.40), 1.4 (1.00) | 1.3 (0.64), 1.2 (0.54), 1.4 (0.52), 2.1 (0.20), 1.1 (0.19) | 0ms / 0ms |
| **`buddhist-dhamma-middle-way`** | *Buddhist Dhamma 1.4* | 1.3 (1.00), 1.4 (1.40) | 1.4 (0.65), 1.3 (0.55), 1.2 (0.22), 2.1 (0.20), 1.1 (0.19) | 0ms / 0ms |
| **`buddhist-dhamma-metta`** | *Buddhist Dhamma 2.1* | 1.1 (0.40), 1.2 (0.40), 1.3 (0.40), 1.4 (0.40), 2.1 (0.40) | 2.1 (0.66), 2.2 (0.54), 1.2 (0.22), 1.4 (0.20), 1.1 (0.19) | 0ms / 0ms |
| **`buddhist-dhamma-impermanence`** | *Buddhist Dhamma 2.2* | 1.1 (0.40), 1.2 (0.40), 1.3 (0.40), 1.4 (0.40), 2.1 (0.40) | 2.2 (0.61), 2.1 (0.51), 1.2 (0.22), 1.4 (0.20), 1.1 (0.19) | 1ms / 0ms |

## 📊 Analysis & Verification Summary

1. **Exact Target Hit**: The embedding-backed retriever successfully matched the exact target Buddhist Dhamma line as the top-1 result (rank 1) with cosine similarity ($ge 0.3$) across the eval queries.
2. **Nearby Verse Relevance (Neighbor Augmentation)**: For queries matching a primary scripture line, the retriever automatically augmented the context with the adjacent neighbor line (preceding/succeeding) where available, matching the surrounding context exactly.
3. **Tail Noise Reduction**: Noisy, low-scoring tail results have been pruned by setting a similarity threshold of $ge 0.1$, resulting in a clean, context-focused output list.
