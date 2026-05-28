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
  PramanaNoFinalAnswerError,
} from './openai-compatible';

/**
 * Configuration for the Sarvam provider.
 */
export interface SarvamProviderConfig {
  /** API key / bearer token for the Sarvam API. */
  apiKey?: string;
  /** Sarvam model name override (default: sarvam-30b). */
  model?: string;
  /** Request timeout in milliseconds. Default: 30000. */
  timeoutMs?: number;
}

/** Raw response body from the Sarvam /v1/chat/completions endpoint. */
interface SarvamRawResponse {
  id?: string;
  model?: string;
  output_text?: string;
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
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ---------------------------------------------------------------------------
// Reasoning effort → Sarvam thinking parameter
// ---------------------------------------------------------------------------

type SarvamThinkingParam =
  | { type: 'disabled' }
  | { type: 'enabled'; budget_tokens: number };

function buildThinkingParam(
  effort: 'none' | 'low' | 'medium' | 'high' | undefined
): SarvamThinkingParam | undefined {
  switch (effort) {
    case 'none':
      return { type: 'disabled' };
    case 'low':
      return { type: 'enabled', budget_tokens: 1024 };
    case 'medium':
      return { type: 'enabled', budget_tokens: 4096 };
    case 'high':
      return { type: 'enabled', budget_tokens: 8192 };
    default:
      // undefined → omit the parameter, use Sarvam's server-side default
      return undefined;
  }
}

/**
 * Sarvam starter-tier hard limit on max_tokens.
 * Sending anything above this causes an immediate HTTP 400.
 */
const SARVAM_MAX_TOKENS_LIMIT = 4096;

/**
 * Returns the minimum max_tokens budget needed given a reasoning effort,
 * capped at the starter-tier limit (4096).
 *
 * When reasoning is enabled, some of the token budget is consumed by the
 * chain-of-thought before the final answer. We add the thinking budget on
 * top of the caller's requested output tokens so the final answer is never
 * squeezed out by the reasoning chain — but we never exceed the API cap.
 */
function resolveMaxTokens(
  requestedTokens: number | undefined,
  effort: 'none' | 'low' | 'medium' | 'high' | undefined
): number {
  const base = Math.max(requestedTokens ?? 800, 400);
  let resolved: number;
  switch (effort) {
    case 'none':
      resolved = base;
      break;
    case 'low':
      // 1024 thinking + base for response
      resolved = base + 1024;
      break;
    case 'medium':
      resolved = base + 4096;
      break;
    case 'high':
      resolved = base + 8192;
      break;
    default:
      // Unknown effort or not set — use safe default that covers a reasoning chain
      resolved = Math.max(base, 4000);
      break;
  }
  return Math.min(resolved, SARVAM_MAX_TOKENS_LIMIT);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Sarvam inference provider.
 *
 * Implements the real HTTP fetch path when SARVAM_API_KEY is configured.
 *
 * Supports:
 * - Multi-turn chat history via prompt.messages
 * - Per-request reasoning effort via prompt.reasoningEffort → thinking param
 * - Automatic single retry with reasoning disabled on no-final-answer condition
 * - Typed errors (PramanaNoFinalAnswerError / PramanaOutputTruncatedError)
 *   so inference.ts can classify and fall through to the next provider
 */
export class SarvamProvider implements PramanaInferenceProvider {
  readonly info: InferenceProviderInfo = {
    id: 'sarvam-hosted',
    displayName: 'Sarvam AI (Hosted)',
    providerClass: 'hosted',
    capabilities: {
      textGeneration: true,
      structuredJsonGeneration: true,
      retrievalGroundedGeneration: true,
      streaming: false,
      embeddings: false,
    },
  };

  private readonly config: SarvamProviderConfig | undefined;

  constructor(config?: SarvamProviderConfig) {
    this.config = config;
  }

  isAvailable(): boolean {
    return Boolean(this.config?.apiKey);
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.config?.apiKey) {
      throw new Error(
        `[${this.info.id}] Sarvam API key is not configured. ` +
        `Set SARVAM_API_KEY to enable Sarvam inference.`
      );
    }

    const effort = request.prompt.reasoningEffort;

    // First attempt with the caller's stated reasoning effort
    try {
      return await this._doGenerate(request, effort);
    } catch (err) {
      // Bounded single retry: if the model completed reasoning but produced
      // no final answer, or it spent its budget before emitting the final
      // answer, try once more with thinking disabled.
      // This frequently recovers because a direct completion can use the full
      // output budget instead of burning it on hidden reasoning.
      if (err instanceof PramanaNoFinalAnswerError || err instanceof PramanaOutputTruncatedError) {
        console.warn(
          `[${this.info.id}] retry_due_to_incomplete_answer: ` +
          `first attempt did not produce a complete final answer (reasoningEffort=${effort ?? 'default'}). ` +
          `Retrying once with thinking disabled.`
        );
        try {
          const retryResult = await this._doGenerate(request, 'none', true);
          console.info(
            `[${this.info.id}] final_success_after_retry: ` +
            `recovered with thinking disabled.`
          );
          return retryResult;
        } catch (retryErr) {
          // Retry also failed — re-throw so inference.ts can fall through to the next available provider.
          console.warn(
            `[${this.info.id}] retry_failed: ` +
            `second attempt also failed to produce a complete final answer. ` +
            `Re-throwing for caller to handle failover.`
          );
          throw err;
        }
      }
      throw err;
    }
  }

  /**
   * Executes one HTTP round-trip to the Sarvam completions endpoint.
   *
   * @param request        - The inference request
   * @param effortOverride - If supplied, overrides request.prompt.reasoningEffort
   *                         for this specific call (used by the retry path).
   * @param isRetry        - True only on the second attempt (thinking-disabled retry).
   *                         Used to activate the enlarged token budget for that path.
   */
  private async _doGenerate(
    request: InferenceRequest,
    effortOverride?: 'none' | 'low' | 'medium' | 'high' | undefined,
    isRetry = false,
  ): Promise<InferenceResponse> {
    const effort = effortOverride !== undefined ? effortOverride : request.prompt.reasoningEffort;
    const url = 'https://api.sarvam.ai/v1/chat/completions';
    const timeoutMs = request.timeoutMs ?? this.config!.timeoutMs ?? 30_000;

    // ── Build message list ─────────────────────────────────────────────────
    const messages: Array<{ role: string; content: string }> = [];

    // 1. System instruction
    if (request.prompt.system) {
      messages.push({ role: 'system', content: request.prompt.system });
    }

    // 2. Prior conversation turns (multi-turn history)
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
    const thinking = buildThinkingParam(effort);
    const maxTokens = isRetry
      // Retry path: thinking is disabled so no reasoning headroom needed,
      // but if we got here because of OUTPUT_TRUNCATED the caller's budget
      // was too small — double it (floor 2048) so the retry actually has a
      // chance of succeeding instead of truncating a second time.
      // Still cap at the starter-tier limit so we never send > 4096.
      ? Math.min(Math.max((request.prompt.maxOutputTokens ?? 800) * 2, 2048), SARVAM_MAX_TOKENS_LIMIT)
      : resolveMaxTokens(request.prompt.maxOutputTokens, effort);

    const payload: Record<string, unknown> = {
      model: this.config!.model ?? 'sarvam-30b',
      messages,
      temperature: request.prompt.temperature ?? 0.3,
      max_tokens: maxTokens,
      ...(request.responseFormat === 'json'
        ? { response_format: { type: 'json_object' } }
        : {}),
    };

    if (thinking !== undefined) {
      payload['thinking'] = thinking;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api-subscription-key': this.config!.apiKey!,
    };

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

    let data: SarvamRawResponse;
    try {
      data = await rawResponse.json() as SarvamRawResponse;
    } catch {
      throw new Error(`[${this.info.id}] Server response is not valid JSON.`);
    }

    const choice = data.choices?.[0];
    const generatedText = extractAssistantText(data);

    if (typeof generatedText !== 'string') {
      // Classify why content is absent and throw a typed error.
      const reason = classifyMissingContent(choice);

      if (reason === 'truncated') {
        throw new PramanaOutputTruncatedError(this.info.id);
      }
      if (reason === 'no_final_answer') {
        throw new PramanaNoFinalAnswerError(this.info.id);
      }

      // Fallback: genuinely empty response
      const rawSnippet = summarizeOpenAICompatibleResponse(data);
      throw new Error(
        `[${this.info.id}] Malformed response: missing usable assistant text. Raw: ${rawSnippet}`
      );
    }

    return {
      text: generatedText,
      modelUsed: data.model ?? this.config!.model ?? 'sarvam-30b',
      provider: this.info.id,
      providerClass: 'hosted',
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

  async *generateStream(_request: InferenceRequest): AsyncIterable<string> {
    throw new Error(`[${this.info.id}] generateStream is not yet implemented.`);
  }
}
