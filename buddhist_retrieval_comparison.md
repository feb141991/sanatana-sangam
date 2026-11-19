# Buddhist Dhamma Retrieval Comparison Report

This report compares the retrieval behavior of the traditional **Heuristic Retriever** against the new **Embedding-Backed Retriever** on the Buddhist Dhamma eval cases.

| Case ID | Query Text | Heuristic Retrieved Chunks (Base Score) | Embedding-Backed Retrieved Chunks (Cosine Similarity Score) | Latency (Heur / Embed) |
| :--- | :--- | :--- | :--- | :--- |
| **`buddhist-dhamma-dukkha`** | *Buddhist Dhamma 1.1* | 1.1 (2.42), 1.2 (2.02) | 1.1 (0.69), 1.2 (0.57) | 2ms / 2ms |
| **`buddhist-dhamma-anatta`** | *Buddhist Dhamma 1.2* | 1.2 (2.42), 1.1 (2.02), 1.3 (1.85) | 1.2 (0.75), 1.1 (0.65), 1.3 (0.63) | 0ms / 0ms |
| **`buddhist-dhamma-dependent-origination`** | *Buddhist Dhamma 1.3* | 1.3 (2.25), 1.2 (2.02), 1.4 (1.85) | 1.3 (0.72), 1.2 (0.62), 1.4 (0.60) | 0ms / 1ms |
| **`buddhist-dhamma-middle-way`** | *Buddhist Dhamma 1.4* | 1.4 (2.25), 1.3 (1.85), 1.5 (1.85) | 1.4 (0.73), 1.3 (0.63), 1.5 (0.61) | 0ms / 0ms |
| **`buddhist-dhamma-metta`** | *Buddhist Dhamma 2.1* | 2.1 (2.25), 2.2 (1.85) | 2.1 (0.76), 2.2 (0.64) | 0ms / 0ms |
| **`buddhist-dhamma-impermanence`** | *Buddhist Dhamma 2.2* | 2.2 (2.25), 2.1 (1.85), 2.3 (1.85) | 2.2 (0.67), 2.1 (0.57), 2.3 (0.55) | 0ms / 1ms |

## 📊 Analysis & Verification Summary

1. **Exact Target Hit**: The embedding-backed retriever successfully matched the exact target Buddhist Dhamma line as the top-1 result (rank 1) with cosine similarity ($ge 0.3$) across the eval queries.
2. **Nearby Verse Relevance (Neighbor Augmentation)**: For queries matching a primary scripture line, the retriever automatically augmented the context with the adjacent neighbor line (preceding/succeeding) where available, matching the surrounding context exactly.
3. **Tail Noise Reduction**: Noisy, low-scoring tail results have been pruned by setting a similarity threshold of $ge 0.1$, resulting in a clean, context-focused output list.
