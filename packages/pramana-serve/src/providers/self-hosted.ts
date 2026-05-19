import type {
  PramanaInferenceProvider,
  InferenceProviderInfo,
  InferenceRequest,
  InferenceResponse,
} from '@sangam/pramana-core';

// ---------------------------------------------------------------------------
// Self-Hosted Inference Provider
// ---------------------------------------------------------------------------

/**
 * Expected endpoint contract for a self-hosted Pramana inference server.
 *
 * The self-hosted runtime must expose:
 *   POST /v1/generate
 *
 * Request payload:
 * ```json
 * {
 *   "prompt": "<string>",
 *   "system": "<string | null>",
 *   "temperature": 0.3,
 *   "max_tokens": 800,
 *   "response_format": "text" | "json",
 *   "json_schema": { "type": "object", "properties": {...} },
 *   "grounding_context": [{ "content": "...", "metadata": {...} }],
 *   "stream": false
 * }
 * ```
 *
 * Expected response shape:
 * ```json
 * {
 *   "text": "<generated text>",
 *   "model": "<model id>",
 *   "finish_reason": "stop" | "length" | "error",
 *   "usage": {
 *     "input_tokens": 100,
 *     "output_tokens": 50,
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

/** Raw response body from the self-hosted /v1/generate endpoint. */
interface SelfHostedRawResponse {
  text?: string;
  model?: string;
  finish_reason?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Self-hosted inference provider.
 *
 * Implements the real HTTP fetch path when PRAMANA_SELF_HOSTED_URL is configured.
 * Remains inert and safely throws when no URL is configured.
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
   * Makes a real HTTP POST to `baseUrl/v1/generate` when baseUrl is set.
   * Throws a clear configuration error when no URL is available.
   */
  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.config?.baseUrl) {
      throw new Error(
        `[${this.info.id}] Self-hosted inference runtime is not configured. ` +
        `Set PRAMANA_SELF_HOSTED_URL to enable private model serving.`
      );
    }

    const url = `${this.config.baseUrl.replace(/\/$/, '')}/v1/generate`;
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs ?? 30_000;

    // Build normalized request payload
    const payload = {
      prompt: request.prompt.user ?? '',
      system: request.prompt.system ?? null,
      temperature: request.prompt.temperature ?? 0.3,
      max_tokens: request.prompt.maxOutputTokens ?? 800,
      response_format: request.responseFormat ?? 'text',
      ...(request.jsonSchema ? { json_schema: request.jsonSchema } : {}),
      grounding_context: request.groundingContext ?? [],
      stream: false,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Abort controller for timeout
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

    if (typeof data.text !== 'string') {
      throw new Error(
        `[${this.info.id}] Malformed response: missing or non-string 'text' field.`
      );
    }

    return {
      text: data.text,
      modelUsed: data.model ?? this.config.model ?? 'self-hosted-unknown',
      provider: this.info.id,
      providerClass: 'self_hosted',
      finishReason: data.finish_reason,
      usage: data.usage ? {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
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
