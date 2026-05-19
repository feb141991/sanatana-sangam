# Shoonaya Private AI Pipeline

Lightweight Phase 1 Python scaffold for Shoonaya's private AI workspace.

This directory is intentionally small and safe to land early. It provides:

- a Python package layout under `src/ai_pipeline`
- starter corpus schema helpers
- placeholder chunking, embeddings, retrieval, eval, serving, and training modules
- sample manifest and eval dataset files

## Scope

This workspace follows `PRIVATE_AI_PHASE1_PLAN.md` and is focused on:

- corpus truth and metadata
- retrieval-oriented chunking
- embeddings and vector-ready records
- private gateway integration points
- evaluation harness placeholders
- LoRA training readiness artifacts

It does not assume a specific vector database, model host, or training stack yet.

## Quick start

```bash
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya/python/ai_pipeline"
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python -m ai_pipeline.chunking.chunk_scriptures corpus/manifests/example_document.json
python -m ai_pipeline.evals.run_evals
```

## Layout

```text
python/ai_pipeline/
  corpus/
    raw/
    normalized/
    manifests/
  datasets/
    instruction/
    evals/
  src/ai_pipeline/
    chunking/
    corpus/
    embeddings/
    evals/
    retrieval/
    serving/
    training/
  training/
    configs/
```

## Next steps

1. Replace sample manifest files with exported normalized corpus records.
2. Wire `EmbeddingModelRegistry` to the chosen embedding implementation.
3. Connect `SearchBackend` to the selected vector index.
4. Expand eval datasets before any fine-tuning work starts.
