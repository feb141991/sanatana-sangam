import type {
  PramanaInferenceProvider,
  InferenceProviderInfo,
  InferenceRequest,
  InferenceResponse,
} from '@sangam/pramana-core';
import {
  extractAssistantText,
  classifyMissingContent,
  summarizeOpenAICompatibleResponse,
  PramanaOutputTruncatedError,
} from './openai-compatible';

// ---------------------------------------------------------------------------
// Self-Hosted Inference Provider
// ---------------------------------------------------------------------------

/**
 * Expected endpoint contract for a self-hosted Pramana inference server.
 *
 * The self-hosted runtime must expose:
 *   POST /v1/chat/completions
 *
 * Request payload:
 * ```json
 * {
 *   "model": "<string>",
 *   "messages": [
 *     { "role": "system", "content": "..." },
 *     { "role": "user",   "content": "..." },
 *     { "role": "assistant", "content": "..." },
 *     { "role": "user",   "content": "<current message>" }
 *   ],
 *   "temperature": 0.3,
 *   "max_tokens": 800,
 *   "response_format": { "type": "json_object" }
 * }
 * ```
 *
 * Expected response shape:
 * ```json
 * {
 *   "id": "...",
 *   "model": "<model id>",
 *   "choices": [
 *     {
 *       "message": { "content": "<generated text>" },
 *       "finish_reason": "stop" | "length"
 *     }
 *   ],
 *   "usage": {
 *     "prompt_tokens": 100,
 *     "completion_tokens": 50,
 *     "total_tokens": 150
 *   }
 * }
 * ```
 *
 * Candidate runtimes:
 * - vLLM (https://github.com/vllm-project/vllm)
 * - Ollama (https://ollama.com)
 * - llama.cpp server mode
 * - Text Generation Inference (HuggingFace TGI)
 */

/** Configuration for the self-hosted provider. */
export interface SelfHostedProviderConfig {
  /** Base URL of the self-hosted inference server (e.g. "http://localhost:8080"). */
  baseUrl: string;
  /** Model identifier to request from the server. */
  model?: string;
  /** Optional API key / bearer token for the self-hosted server. */
  apiKey?: string;
  /** Request timeout in milliseconds. Default: 30000. */
  timeoutMs?: number;
}

/** Raw response body from the self-hosted /v1/chat/completions endpoint. */
interface SelfHostedRawResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    text?: string;
    message?: {
      content?:
        | string
        | Array<{ type?: string; text?: string; content?: string }>
        | { text?: string; content?: string };
      reasoning_content?: string;
    };
    finish_reason?: string;
  }>;
  output_text?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Self-hosted inference provider.
 *
 * Implements the real HTTP fetch path when PRAMANA_SELF_HOSTED_URL is configured.
 * Remains inert and safely throws when no URL is configured.
 *
 * Changes vs. previous version:
 * - Multi-turn chat history: prompt.messages is injected between system and current user
 * - prompt.reasoningEffort is silently ignored (generic backends don't support thinking control)
 * - Typed errors: PramanaOutputTruncatedError is thrown when finish_reason === 'length'
 */
export class SelfHostedProvider implements PramanaInferenceProvider {
  readonly info: InferenceProviderInfo = {
    id: 'self-hosted',
    displayName: 'Pramana Self-Hosted (Private)',
    providerClass: 'self_hosted',
    capabilities: {
      textGeneration: true,
      structuredJsonGeneration: true,
      retrievalGroundedGeneration: true,
      streaming: false,
      embeddings: false,
    },
  };

  private readonly config: SelfHostedProviderConfig | undefined;

  constructor(config?: SelfHostedProviderConfig) {
    this.config = config;
  }

  /**
   * Returns true only when a self-hosted base URL is configured.
   */
  isAvailable(): boolean {
    return Boolean(this.config?.baseUrl);
  }

  /**
   * Generate text using the self-hosted runtime.
   *
   * Makes a real HTTP POST to `baseUrl/v1/chat/completions` when baseUrl is set.
   * Throws a clear configuration error when no URL is available.
   */
  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.config?.baseUrl) {
      throw new Error(
        `[${this.info.id}] Self-hosted inference runtime is not configured. ` +
        `Set PRAMANA_SELF_HOSTED_URL to enable private model serving.`
      );
    }

    const url = `${this.config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs ?? 30_000;

    // ── Build message list ─────────────────────────────────────────────────
    const messages: Array<{ role: string; content: string }> = [];

    // 1. System instruction
    if (request.prompt.system) {
      messages.push({ role: 'system', content: request.prompt.system });
    }

    // 2. Prior conversation turns (multi-turn history parity with Gemini + Sarvam)
    //    PromptMessage roles are 'user' | 'assistant' — OpenAI-compatible as-is.
    if (request.prompt.messages && request.prompt.messages.length > 0) {
      for (const msg of request.prompt.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // 3. Current user message, optionally prepended with grounding context
    let finalUserPrompt = request.prompt.user ?? '';
    if (request.groundingContext && request.groundingContext.length > 0) {
      const contextText = request.groundingContext
        .map(
          (c, i) =>
            `Source [${i + 1}]: ${c.metadata?.sourceName || ''} - ${c.metadata?.chunkId || ''}\n${c.content}`
        )
        .join('\n\n');
      finalUserPrompt = `${contextText}\n\n====================\n\n${finalUserPrompt}`;
    }
    messages.push({ role: 'user', content: finalUserPrompt });

    // ── Build payload ──────────────────────────────────────────────────────
    // Note: prompt.reasoningEffort is intentionally not forwarded.
    // Generic self-hosted backends (vLLM, Ollama, llama.cpp, TGI) do not
    // uniformly support thinking-budget parameters, so we omit it to stay
    // compatible across all runtimes.
    const payload: Record<string, unknown> = {
      model: this.config.model ?? 'default-model',
      messages,
      temperature: request.prompt.temperature ?? 0.3,
      max_tokens: request.prompt.maxOutputTokens ?? 800,
      ...(request.responseFormat === 'json'
        ? { response_format: { type: 'json_object' } }
        : {}),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let rawResponse: Response;
    try {
      rawResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[${this.info.id}] HTTP request failed: ${msg}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!rawResponse.ok) {
      let errorBody = '';
      try { errorBody = await rawResponse.text(); } catch { /* ignore */ }
      throw new Error(
        `[${this.info.id}] Server returned HTTP ${rawResponse.status}: ${errorBody.slice(0, 300)}`
      );
    }

    let data: SelfHostedRawResponse;
    try {
      data = await rawResponse.json() as SelfHostedRawResponse;
    } catch {
      throw new Error(
        `[${this.info.id}] Server response is not valid JSON. ` +
        `Check that the runtime is running and returning application/json.`
      );
    }

    const choice = data.choices?.[0];
    const generatedText = extractAssistantText(data);

    if (typeof generatedText !== 'string') {
      const reason = classifyMissingContent(choice);

      if (reason === 'truncated') {
        throw new PramanaOutputTruncatedError(this.info.id);
      }

      // For self-hosted: 'no_final_answer' and 'empty' both use a generic message
      // (self-hosted models rarely emit reasoning_content, so the distinction is moot)
      throw new Error(
        `[${this.info.id}] Malformed response: missing usable assistant text. Raw: ${summarizeOpenAICompatibleResponse(data)}`
      );
    }

    return {
      text: generatedText,
      modelUsed: data.model ?? this.config.model ?? 'self-hosted-unknown',
      provider: this.info.id,
      providerClass: 'self_hosted',
      finishReason: choice?.finish_reason,
      usage: data.usage
        ? {
            inputTokens: data.usage.prompt_tokens,
            outputTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Streaming inference via self-hosted runtime.
   * Stubbed — streaming not yet implemented.
   */
  async *generateStream(_request: InferenceRequest): AsyncIterable<string> {
    throw new Error(`[${this.info.id}] generateStream is not yet implemented.`);
  }
}
