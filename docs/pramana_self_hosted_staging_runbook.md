# Pramana Self-Hosted Inference — Staging Runbook

This document describes how to stand up a local or remote self-hosted inference runtime for Pramana staging and how to run parity evaluations against it.

> [!NOTE]
> Pramana defaults to the **Gemini hosted provider** in production.  
> Self-hosted mode is opt-in via a single environment variable. No committed code hard-switches to self-hosted.

---

## 1. Canonical Self-Hosted Contract

All Pramana routes consume the **OpenAI Chat Completions v1 API**:

```
POST {PRAMANA_SELF_HOSTED_URL}/v1/chat/completions
Content-Type: application/json

{
  "model": "<model-id>",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user",   "content": "..." }
  ],
  "temperature": 0.3,
  "max_tokens": 800
}
```

Expected response:
```json
{
  "id": "chatcmpl-...",
  "choices": [{ "message": { "content": "..." }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

---

## 2. Validated Staging Stack — Ollama

**Tested model**: `qwen2.5:0.5b` (397 MB, fits in 16 GB RAM)  
**Ollama version**: any recent release  
**Endpoint**: `http://localhost:11434`

### 2.1 Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 2.2 Start Server & Pull Model

```bash
# Start Ollama daemon (auto-starts on macOS after install)
ollama serve

# In a separate terminal — pull the staging-validated model
ollama pull qwen2.5:0.5b

# Verify it is available
ollama list
```

### 2.3 Smoke-Test the Endpoint

```bash
curl -s http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:0.5b",
    "messages": [{"role": "user", "content": "Say hi"}]
  }' | python3 -m json.tool
```

Expected: JSON response with `choices[0].message.content` containing text.

> [!CAUTION]
> `qwen3:30b` (18 GB) crashes on 16 GB RAM systems. Use `qwen2.5:0.5b` for local staging. Only use larger models on machines with ≥ 32 GB RAM.

---

## 3. Required Environment Variables

| Variable | Required? | Description |
| :--- | :---: | :--- |
| `PRAMANA_SELF_HOSTED_URL` | ✅ Yes | Base URL of the OpenAI-compatible runtime. Example: `http://localhost:11434` |
| `PRAMANA_SELF_HOSTED_MODEL` | Optional | Model identifier to pass in the payload. Default: `default-model`. Example: `qwen2.5:0.5b` |
| `PRAMANA_SELF_HOSTED_API_KEY` | Optional | Bearer token if the self-hosted server requires auth. |
| `PRAMANA_INFERENCE_PROVIDER` | Optional | Set to `self-hosted` to switch the **TypeScript runtime** from Gemini to self-hosted. Default: `gemini-hosted`. |

Set these in your shell or in `.env.local` (not committed):

```bash
export PRAMANA_SELF_HOSTED_URL=http://localhost:11434
export PRAMANA_SELF_HOSTED_MODEL=qwen2.5:0.5b
```

---

## 4. Provider Switch (TypeScript Runtime)

All Pramana API routes (`/api/ai/chat`, `DharmaChat`, etc.) respect the `PRAMANA_INFERENCE_PROVIDER` env var:

| Value | Effect |
| :--- | :--- |
| *(unset)* | Default: Gemini hosted |
| `gemini-hosted` | Explicit Gemini hosted |
| `self-hosted` | Routes to `PRAMANA_SELF_HOSTED_URL/v1/chat/completions` |

To run the app against a local Ollama instance:
```bash
PRAMANA_INFERENCE_PROVIDER=self-hosted \
PRAMANA_SELF_HOSTED_URL=http://localhost:11434 \
PRAMANA_SELF_HOSTED_MODEL=qwen2.5:0.5b \
npm run dev
```

No code changes are required. Gemini remains the default in production.

---

## 5. Running Parity Evaluations

### 5.1 Run All Suites Against Self-Hosted

```bash
PYTHONPATH=python/ai_pipeline/src \
PRAMANA_SELF_HOSTED_URL=http://localhost:11434 \
PRAMANA_SELF_HOSTED_MODEL=qwen2.5:0.5b \
python3 -m ai_pipeline.evals.compare_providers --modes mock self-hosted
```

### 5.2 Run a Single Suite

```bash
PYTHONPATH=python/ai_pipeline/src \
PRAMANA_SELF_HOSTED_URL=http://localhost:11434 \
PRAMANA_SELF_HOSTED_MODEL=qwen2.5:0.5b \
python3 -m ai_pipeline.evals.compare_providers --modes self-hosted --suites pathshala_gita
```

### 5.3 npm Script Shorthand

```bash
PRAMANA_SELF_HOSTED_URL=http://localhost:11434 \
PRAMANA_SELF_HOSTED_MODEL=qwen2.5:0.5b \
npm run eval:compare -- --modes self-hosted
```

### 5.4 Output Artifacts

After running, these files are updated at the repo root:
- `pramana_provider_comparison.json` — machine-readable parity data
- `pramana_self_hosted_provider_comparison.md` — human-readable status report
- `pramana_hosted_provider_comparison.md` — hosted status report

---

## 6. Confirmed Staging Results (2026-05-20)

| Suite | Mock (baseline) | Self-Hosted (qwen2.5:0.5b) | Live Runs |
| :--- | :---: | :---: | :---: |
| `pathshala_gita` | 100% (6/6) | 67% (4/6) | 6 |
| `bhakti_katha` | 100% (6/6) | — (new) | — |
| `bhakti_panchatantra` | 100% (6/6) | — (new) | — |
| `pathshala_upanishads` | 100% (6/6) | — (new) | — |
| `sikh_gurbani` | 100% (6/6) | — (new) | — |

**Notes:**
- 67% Gita pass rate against `qwen2.5:0.5b` is expected: the 0.5B model lacks the reasoning depth for structured JSON scoring. A 7B+ model is recommended for production parity.
- The endpoint (`localhost:11434`) was confirmed reachable and returning valid OpenAI-compatible JSON.
- Zero-config success (no env vars set) remains intact: the harness falls back to mock.

---

## 7. Alternative Runtimes

| Runtime | OpenAI-Compatible? | Notes |
| :--- | :---: | :--- |
| **Ollama** | ✅ Yes (`/v1/chat/completions`) | Easiest local setup. Validated. |
| **vLLM** | ✅ Yes | Best for CUDA GPU servers. |
| **llama.cpp server** | ✅ Yes (`--server` mode) | CPU-only option for limited hardware. |
| **HuggingFace TGI** | ✅ Yes | Good for HF model hub models. |
| **LM Studio** | ✅ Yes | macOS GUI option. |

All runtimes should work as long as they expose `/v1/chat/completions`.

---

## 8. Staging Go/No-Go Checklist

- [ ] Ollama running: `curl http://localhost:11434/api/tags` returns `{"models":[...]}`
- [ ] Model available: `ollama list` shows the target model
- [ ] Endpoint reachable: smoke-test curl returns valid JSON
- [ ] Eval comparison run: `npm run eval:compare -- --modes self-hosted` completes without crash
- [ ] `pramana_self_hosted_provider_comparison.md` shows `🟢 REAL SELF-HOSTED EXECUTION SUCCESSFUL`
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`
