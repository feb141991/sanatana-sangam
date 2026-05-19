# Pramana Self-Hosted Inference Plan

This document outlines the architecture, contracts, and roadmap for enabling self-hosted (private) model inference in Pramana, alongside the current hosted Gemini path.

---

## 1. Provider Contract

All inference providers implement the `PramanaInferenceProvider` interface defined in `@sangam/pramana-core`:

```typescript
interface PramanaInferenceProvider {
  readonly info: InferenceProviderInfo;
  isAvailable(): boolean;
  generate(request: InferenceRequest): Promise<InferenceResponse>;
}
```

### Request Shape (`InferenceRequest`)
| Field | Type | Description |
|:---|:---|:---|
| `prompt` | `PromptSpec` | System + user messages, temperature, maxOutputTokens |
| `responseFormat` | `'text' \| 'json'` | Optional: request structured JSON output |
| `jsonSchema` | `Record<string, unknown>` | Optional: JSON Schema to enforce when `responseFormat` is JSON |
| `groundingContext` | `Array<{content, metadata}>` | Optional: retrieval context for grounded generation |
| `stream` | `boolean` | Optional: request streaming response |
| `timeoutMs` | `number` | Optional: request timeout |

### Response Shape (`InferenceResponse`)
| Field | Type | Description |
|:---|:---|:---|
| `text` | `string` | Generated output text |
| `modelUsed` | `string` | Model ID that served the request |
| `provider` | `string` | Provider identifier |
| `providerClass` | `'hosted' \| 'self_hosted'` | Hosting class |
| `finishReason` | `string?` | Completion reason |
| `usage` | `{inputTokens?, outputTokens?, totalTokens?}` | Token usage metrics |

---

## 2. Registered Providers

| Provider ID | Class | Status | Runtime |
|:---|:---|:---|:---|
| `gemini-hosted` | Hosted | ✅ Active (production default) | Google Cloud API |
| `self-hosted` | Self-hosted | 🟡 Scaffolded (stub) | vLLM / Ollama / TGI |

---

## 3. Self-Hosted Endpoint Contract

The self-hosted runtime must expose a single endpoint:

```
POST /v1/generate
```

**Request payload:**
```json
{
  "prompt": "<user prompt text>",
  "system": "<system instruction or null>",
  "temperature": 0.3,
  "max_tokens": 800,
  "response_format": "text",
  "json_schema": { "type": "object", "properties": {} },
  "grounding_context": [
    { "content": "...", "metadata": { "sourceName": "...", "chunkId": "..." } }
  ],
  "stream": false
}
```

### Readiness Status
- **Scaffolded & Ready**: The `SelfHostedProvider` class exists, the provider selector correctly parses env vars, and the payload transformation code maps `InferenceRequest` to the above expected JSON format (including `response_format`, `json_schema`, `grounding_context`, and `stream`).
- **Stubbed**: The actual `fetch` call to `baseUrl` is currently commented out, and calling `generate` or `generateStream` throws a "not implemented" error safely. Streaming is declared as `false` in capabilities.
- **Blocker for Switchover**: An actual external local server (e.g., vLLM or Ollama) must be deployed and the `fetch` block inside `packages/pramana-serve/src/providers/self-hosted.ts` must be uncommented and tested.

**Response:**
```json
{
  "text": "<generated text>",
  "model": "<model-id>",
  "finish_reason": "stop",
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50,
    "total_tokens": 150
  }
}
```

---

## 4. Provider Selection (How Switching Works)

Provider selection is config-driven via environment variables:

| Env Variable | Purpose | Default |
|:---|:---|:---|
| `PRAMANA_INFERENCE_PROVIDER` | Active provider ID | `gemini-hosted` |
| `GEMINI_API_KEY` | Hosted Gemini API key | (required for hosted) |
| `PRAMANA_SELF_HOSTED_URL` | Self-hosted runtime base URL | (none) |
| `PRAMANA_SELF_HOSTED_MODEL` | Model name override | (none) |
| `PRAMANA_SELF_HOSTED_API_KEY` | Self-hosted auth token | (none) |

**Resolution order:**
1. Read `PRAMANA_INFERENCE_PROVIDER` → look up provider in registry
2. If the requested provider is available → use it
3. If unavailable → fall back to `gemini-hosted`
4. If neither is available → throw a clear configuration error

**To switch to self-hosted:** Set `PRAMANA_INFERENCE_PROVIDER=self-hosted` and `PRAMANA_SELF_HOSTED_URL=http://your-server:8080` in `.env.local`.

---

## 5. Expected Local/Private Runtime Options

| Runtime | Serving Framework | Notes |
|:---|:---|:---|
| **vLLM** | Python, GPU-optimized | Best throughput for transformer models. Supports OpenAI-compatible API. |
| **Ollama** | Go binary, CPU/GPU | Simplest local setup. Good for development and small-scale testing. |
| **llama.cpp** | C++, CPU/GPU | Lightweight, best for edge deployment. Server mode available. |
| **HuggingFace TGI** | Python, GPU | Production-grade, container-ready. Supports structured output. |

**Recommended first target**: Ollama for development, vLLM for production.

---

## 6. What Still Depends on Hosted APIs Today

| Feature | Provider Dependency | Notes |
|:---|:---|:---|
| Pathshala Explain (all corpora) | Gemini | Primary explanation generation |
| Meaning Generate | Gemini | Translation generation |
| Dharma Chat | Gemini | Conversational AI |
| Embedding Index (TF-IDF) | None | Fully local, no hosted dependency |
| Panchang Calculations | None | Deterministic, no AI |
| Kul/Sabha Access Control | None | Database-level, no AI |

---

## 7. What Is Needed Before Switching Production Traffic

### Must Have
- [ ] Deploy a self-hosted runtime (vLLM or Ollama) with a suitable model
- [ ] Implement the actual `fetch` call in `SelfHostedProvider.generate()`
- [ ] Run the eval suite against self-hosted output to validate quality
- [ ] Add latency/error monitoring for the self-hosted endpoint
- [ ] Test fallback behavior (self-hosted unavailable → Gemini)

### Should Have
- [ ] Add response quality comparison tooling (hosted vs self-hosted on same eval cases)
- [ ] Add admin dashboard widget showing active provider and health status
- [ ] Add structured JSON output validation for the self-hosted path

### Nice to Have
- [ ] Streaming support for long-form responses
- [ ] Model hot-swap without restart (dynamic provider reload)
- [ ] Cost tracking comparison between hosted and self-hosted

---

## 8. File Map

| File | Purpose |
|:---|:---|
| `packages/pramana-core/src/inference-provider.ts` | Provider interface & contracts |
| `packages/pramana-serve/src/providers/hosted-gemini.ts` | Hosted Gemini adapter |
| `packages/pramana-serve/src/providers/self-hosted.ts` | Self-hosted adapter (scaffold) |
| `packages/pramana-serve/src/provider-selector.ts` | Config-based provider selector |
| `src/lib/ai/providers/inference.ts` | App-layer env reader + cached provider |
| `src/lib/ai/providers/gemini.ts` | Legacy Gemini helper (unchanged) |
