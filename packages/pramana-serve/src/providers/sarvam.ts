import type {
  PramanaInferenceProvider,
  InferenceProviderInfo,
  InferenceRequest,
  InferenceResponse,
} from '@sangam/pramana-core';

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

/**
 * Sarvam inference provider.
 *
 * Implements the real HTTP fetch path when SARVAM_API_KEY is configured.
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

  private extractText(data: SarvamRawResponse): string | null {
    const choice = data.choices?.[0];
    const message = choice?.message;
    const content = message?.content;

    if (typeof content === 'string' && content.trim()) {
      return content;
    }

    if (Array.isArray(content)) {
      const joined = content
        .map((part) => {
          if (typeof part?.text === 'string') return part.text;
          if (typeof part?.content === 'string') return part.content;
          return '';
        })
        .join('')
        .trim();
      if (joined) return joined;
    }

    if (content && typeof content === 'object' && !Array.isArray(content)) {
      if (typeof content.text === 'string' && content.text.trim()) {
        return content.text;
      }
      if (typeof content.content === 'string' && content.content.trim()) {
        return content.content;
      }
    }

    if (typeof choice?.text === 'string' && choice.text.trim()) {
      return choice.text;
    }

    if (typeof data.output_text === 'string' && data.output_text.trim()) {
      return data.output_text;
    }

    return null;
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

    const url = 'https://api.sarvam.ai/v1/chat/completions';
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs ?? 30_000;

    // Build normalized request payload
    const messages = [];
    if (request.prompt.system) {
      messages.push({ role: 'system', content: request.prompt.system });
    }
    
    // Inject grounding context into user prompt if present
    let finalUserPrompt = request.prompt.user ?? '';
    if (request.groundingContext && request.groundingContext.length > 0) {
      const contextText = request.groundingContext
        .map((c, i) => `Source [${i+1}]: ${c.metadata?.sourceName || ''} - ${c.metadata?.chunkId || ''}\n${c.content}`)
        .join('\n\n');
      finalUserPrompt = `${contextText}\n\n====================\n\n${finalUserPrompt}`;
    }
    messages.push({ role: 'user', content: finalUserPrompt });

    const payload = {
      model: this.config.model ?? 'sarvam-30b',
      messages,
      temperature: request.prompt.temperature ?? 0.3,
      max_tokens: request.prompt.maxOutputTokens ?? 800,
      ...(request.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api-subscription-key': this.config.apiKey,
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
      throw new Error(
        `[${this.info.id}] Server response is not valid JSON.`
      );
    }

    const choice = data.choices?.[0];
    const generatedText = this.extractText(data);
    
    if (typeof generatedText !== 'string') {
      const rawSnippet = JSON.stringify(data).slice(0, 500);
      throw new Error(
        `[${this.info.id}] Malformed response: missing usable assistant text. Raw: ${rawSnippet}`
      );
    }

    return {
      text: generatedText,
      modelUsed: data.model ?? this.config.model ?? 'sarvam-30b',
      provider: this.info.id,
      providerClass: 'hosted',
      finishReason: choice?.finish_reason,
      usage: data.usage ? {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async *generateStream(_request: InferenceRequest): AsyncIterable<string> {
    throw new Error(`[${this.info.id}] generateStream is not yet implemented.`);
  }
}
