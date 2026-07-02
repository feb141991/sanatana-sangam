import type {
  PramanaInferenceProvider,
  InferenceProviderInfo,
  InferenceRequest,
  InferenceResponse,
} from '@sangam/pramana-core';

export interface GeminiProviderConfig {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';

interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiRawResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }>; role?: string };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { code?: number; message?: string; status?: string };
}

export class GeminiProvider implements PramanaInferenceProvider {
  readonly info: InferenceProviderInfo = {
    id: 'google-gemini',
    displayName: 'Google Gemini',
    providerClass: 'hosted',
    capabilities: {
      textGeneration: true,
      structuredJsonGeneration: true,
      retrievalGroundedGeneration: false,
      streaming: false,
      embeddings: false,
    },
  };

  private readonly config: GeminiProviderConfig | undefined;

  constructor(config?: GeminiProviderConfig) {
    this.config = config;
  }

  isAvailable(): boolean {
    return Boolean(this.config?.apiKey);
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.config?.apiKey) {
      throw new Error(`[${this.info.id}] GEMINI_API_KEY is not configured.`);
    }

    const model = this.config.model ?? DEFAULT_MODEL;
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs ?? 30_000;
    const maxTokens = request.prompt.maxOutputTokens ?? 900;

    // Build Gemini contents array from history + current message
    const contents: GeminiContent[] = [];

    if (request.prompt.messages && request.prompt.messages.length > 0) {
      for (const msg of request.prompt.messages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    let userText = request.prompt.user ?? '';
    if (request.groundingContext && request.groundingContext.length > 0) {
      const ctx = request.groundingContext
        .map((c, i) => `Source [${i + 1}]: ${c.metadata?.sourceName ?? ''}\n${c.content}`)
        .join('\n\n');
      userText = `${ctx}\n\n====================\n\n${userText}`;
    }
    contents.push({ role: 'user', parts: [{ text: userText }] });

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: request.prompt.temperature ?? 0.3,
        ...(request.responseFormat === 'json'
          ? { responseMimeType: 'application/json' }
          : {}),
      },
    };

    if (request.prompt.system) {
      payload['systemInstruction'] = { parts: [{ text: request.prompt.system }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let rawResponse: Response;
    try {
      rawResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      throw new Error(`[${this.info.id}] Server returned HTTP ${rawResponse.status}: ${errorBody.slice(0, 300)}`);
    }

    let data: GeminiRawResponse;
    try {
      data = await rawResponse.json() as GeminiRawResponse;
    } catch {
      throw new Error(`[${this.info.id}] Server response is not valid JSON.`);
    }

    if (data.error) {
      throw new Error(`[${this.info.id}] API error ${data.error.code}: ${data.error.message}`);
    }

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

    if (!text.trim()) {
      throw new Error(`[${this.info.id}] Empty response from Gemini (finishReason: ${candidate?.finishReason ?? 'unknown'})`);
    }

    return {
      text,
      modelUsed: model,
      provider: this.info.id,
      providerClass: 'hosted',
      finishReason: candidate?.finishReason,
      usage: data.usageMetadata
        ? {
            inputTokens: data.usageMetadata.promptTokenCount,
            outputTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }

  async *generateStream(_request: InferenceRequest): AsyncIterable<string> {
    throw new Error(`[${this.info.id}] generateStream is not yet implemented.`);
  }
}
