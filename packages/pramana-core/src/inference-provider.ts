import type { PromptSpec, TextResult } from './types';

// ---------------------------------------------------------------------------
// Inference Provider Abstraction
// ---------------------------------------------------------------------------

/**
 * The hosting class of an inference provider.
 * - hosted:      Cloud-managed API (e.g. Google Gemini, OpenAI, Anthropic).
 * - self_hosted: Privately operated runtime (e.g. vLLM, Ollama, llama.cpp).
 */
export type InferenceProviderClass = 'hosted' | 'self_hosted';

/**
 * Capabilities declared by a provider at registration time.
 */
export interface InferenceProviderCapabilities {
  textGeneration: boolean;
  structuredJsonGeneration: boolean;
  retrievalGroundedGeneration: boolean;
  streaming: boolean;
  embeddings: boolean;
}

/**
 * Static metadata for a registered inference provider.
 */
export interface InferenceProviderInfo {
  /** Unique provider identifier (e.g. "gemini", "ollama-local"). */
  id: string;
  /** Human-readable label shown in diagnostics / admin UIs. */
  displayName: string;
  /** Hosting class. */
  providerClass: InferenceProviderClass;
  /** Capability flags. */
  capabilities: InferenceProviderCapabilities;
}

/**
 * Request payload sent to any inference provider.
 * Wraps the existing PromptSpec with optional inference-level overrides.
 */
export interface InferenceRequest {
  prompt: PromptSpec;
  /** Optional: request structured JSON output instead of free text. */
  responseFormat?: 'text' | 'json';
  /** Optional: JSON Schema to enforce when responseFormat is 'json'. */
  jsonSchema?: Record<string, unknown>;
  /** Optional: retrieved context documents to ground the generation. */
  groundingContext?: Array<{ content: string; metadata?: Record<string, unknown> }>;
  /** Optional: timeout in milliseconds. */
  timeoutMs?: number;
  /** Optional: request streamed response. */
  stream?: boolean;
}

/**
 * Normalised response from any inference provider.
 */
export interface InferenceResponse {
  /** The generated text. */
  text: string;
  /** Model identifier that actually served the request. */
  modelUsed: string;
  /** Provider identifier. */
  provider: string;
  /** Provider hosting class for downstream metadata. */
  providerClass: InferenceProviderClass;
  /** Finish reason, if available. */
  finishReason?: string;
  /** Token usage, if reported by the provider. */
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

/**
 * Core inference provider interface.
 * Every provider adapter (hosted or self-hosted) must implement this.
 */
export interface PramanaInferenceProvider {
  /** Static metadata about the provider. */
  readonly info: InferenceProviderInfo;
  /**
   * Returns true if the provider is currently available and configured.
   * Implementations should check env vars, network reachability, etc.
   */
  isAvailable(): boolean;
  /**
   * Run inference.
   * Throws if the provider is unavailable or the request fails.
   */
  generate(request: InferenceRequest): Promise<InferenceResponse>;
  /**
   * Optional: Run inference and stream the response back.
   * Must throw if streaming is not supported (check info.capabilities.streaming).
   */
  generateStream?(request: InferenceRequest): AsyncIterable<string>;
}

/**
 * Adapts an InferenceResponse to the legacy TextResult shape
 * used by existing route handlers.
 */
export function inferenceResponseToTextResult(res: InferenceResponse): TextResult {
  return {
    text: res.text,
    modelUsed: res.modelUsed,
    provider: res.provider,
    finishReason: res.finishReason,
  };
}
