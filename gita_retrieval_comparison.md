# Bhagavad Gita Retrieval Comparison Report

This report compares the retrieval behavior of the traditional **Heuristic Retriever** against the new **Embedding-Backed Retriever** on the 6 Gita eval cases.

| Case ID | Query Text | Heuristic Retrieved Chunks (Base Score) | Embedding-Backed Retrieved Chunks (Cosine Similarity Score) | Latency (Heur / Embed) |
| :--- | :--- | :--- | :--- | :--- |
| **`pathshala-2-47`** | *Bhagavad Gita 2.47* | 2.46 (0.75), 2.47 (1.15), 2.48 (0.75) | 2.47 (0.61), 18.18 (0.01), 2.18 (0.00), 13.11 (0.00), 13.18 (0.00) | 8ms / 26ms |
| **`pathshala-2-20`** | *Bhagavad Gita 2.20* | 2.19 (0.75), 2.20 (1.15), 2.21 (0.75) | 2.20 (0.65), 18.18 (0.01), 2.18 (0.00), 13.11 (0.00), 13.18 (0.00) | 3ms / 1ms |
| **`pathshala-4-7`** | *Bhagavad Gita 4.7* | 4.6 (0.75), 4.7 (1.15), 4.8 (0.75) | 4.7 (0.70), 18.18 (0.01), 2.18 (0.00), 13.11 (0.00), 13.18 (0.00) | 2ms / 1ms |
| **`pathshala-9-22`** | *Bhagavad Gita 9.22* | 9.21 (0.75), 9.22 (1.15), 9.23 (0.75) | 9.22 (0.65), 18.18 (0.01), 2.18 (0.00), 13.11 (0.00), 13.18 (0.00) | 2ms / 0ms |
| **`pathshala-18-66`** | *Bhagavad Gita 18.66* | 18.65 (0.75), 18.66 (1.15), 18.67 (0.75) | 18.66 (0.59), 18.18 (0.01), 2.18 (0.00), 13.11 (0.00), 13.18 (0.00) | 5ms / 1ms |
| **`pathshala-18-78`** | *Bhagavad Gita 18.78* | 18.77 (0.75), 18.78 (1.15) | 18.78 (0.57), 18.18 (0.01), 2.18 (0.00), 13.11 (0.00), 13.18 (0.00) | 2ms / 0ms |
