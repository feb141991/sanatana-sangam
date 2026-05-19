import type {
  PramanaInferenceProvider,
  InferenceProviderInfo,
  InferenceRequest,
  InferenceResponse,
} from '@sangam/pramana-core';

// ---------------------------------------------------------------------------
// Self-Hosted Inference Provider (Scaffold)
// ---------------------------------------------------------------------------

/**
 * Expected endpoint contract for a self-hosted Pramana inference server.
 *
 * The self-hosted runtime is expected to expose a single endpoint:
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

/**
 * Self-hosted inference provider scaffold.
 *
 * This provider is NOT functional yet — calling generate() will throw
 * a clear "not implemented" error. It exists to:
 *   1. Reserve the adapter contract shape.
 *   2. Define the expected request/response payload for the private runtime.
 *   3. Allow config-based provider selection to reference it.
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
   * Until a real runtime is deployed, this will return false.
   */
  isAvailable(): boolean {
    return Boolean(this.config?.baseUrl);
  }

  /**
   * Generate text using the self-hosted runtime.
   *
   * Currently stubbed — throws an error explaining the runtime is not
   * yet deployed. The request/response normalization code below shows
   * the exact payload shapes that a future implementation will use.
   */
  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.config?.baseUrl) {
      throw new Error(
        `[${this.info.id}] Self-hosted inference runtime is not configured. ` +
        `Set PRAMANA_SELF_HOSTED_URL to enable private model serving.`
      );
    }

    // ----- Request payload normalization (future implementation) -----
    const _payload = {
      prompt: request.prompt.user ?? '',
      system: request.prompt.system ?? null,
      temperature: request.prompt.temperature ?? 0.3,
      max_tokens: request.prompt.maxOutputTokens ?? 800,
      response_format: request.responseFormat ?? 'text',
      json_schema: request.jsonSchema ?? undefined,
      grounding_context: request.groundingContext ?? [],
      stream: false,
    };

    // ----- Response normalization (future implementation) -----
    // const res = await fetch(`${this.config.baseUrl}/v1/generate`, { ... });
    // const data = await res.json();
    // return {
    //   text: data.text,
    //   modelUsed: data.model ?? this.config.model ?? 'unknown',
    //   provider: this.info.id,
    //   providerClass: 'self_hosted',
    //   finishReason: data.finish_reason,
    //   usage: data.usage ? {
    //     inputTokens: data.usage.input_tokens,
    //     outputTokens: data.usage.output_tokens,
    //     totalTokens: data.usage.total_tokens,
    //   } : undefined,
    // };

    throw new Error(
      `[${this.info.id}] Self-hosted inference is scaffolded but not yet implemented. ` +
      `A real vLLM/Ollama/TGI runtime must be deployed before this path can serve traffic.`
    );
  }

  /**
   * Streaming inference via self-hosted runtime.
   * Stubbed for now.
   */
  async *generateStream(request: InferenceRequest): AsyncIterable<string> {
    throw new Error(`[${this.info.id}] generateStream is not yet implemented.`);
  }
}
