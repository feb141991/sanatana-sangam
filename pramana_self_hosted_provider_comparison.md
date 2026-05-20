# 🖥️ Pramana Self-Hosted Provider Comparison Report

This report documents the parity and evaluation results between the local mock baseline and the **Self-Hosted OpenAI-Compatible Provider** (`self-hosted`).

🟢 **Status**: REAL SELF-HOSTED EXECUTION SUCCESSFUL

A real self-hosted execution was successfully completed against the OpenAI-compatible endpoint at the configured URL.

### 📊 Parity Results Table

| Suite Name | Mock Rate | Self-Hosted Rate | Live Runs | Mock Runs | Status / Reason |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `pathshala_gita` | 100% | 50% | 6 | 0 | 🟢 Real Live Run |
| `bhakti_katha` | 100% | 67% | 6 | 0 | 🟢 Real Live Run |
| `bhakti_panchatantra` | 100% | 83% | 6 | 0 | 🟢 Real Live Run |
| `pathshala_upanishads` | 100% | 38% | 16 | 0 | 🟢 Real Live Run |
| `sikh_gurbani` | 100% | 17% | 0 | 0 | 🛑 Fallback to Mock |
