import type {
  PramanaInferenceProvider,
  InferenceProviderInfo,
  InferenceRequest,
  InferenceResponse,
} from '@sangam/pramana-core';
import { GeminiModelAdapter } from './gemini';

/**
 * Hosted Gemini inference provider.
 *
 * Wraps the existing GeminiModelAdapter to conform to the unified
 * PramanaInferenceProvider contract. This is the current production default.
 */
export class HostedGeminiProvider implements PramanaInferenceProvider {
  readonly info: InferenceProviderInfo = {
    id: 'gemini-hosted',
    displayName: 'Google Gemini (Hosted)',
    providerClass: 'hosted',
    capabilities: {
      textGeneration: true,
      structuredJsonGeneration: true,
      retrievalGroundedGeneration: false,
      streaming: false,
      embeddings: false,
    },
  };

  private readonly apiKey: string | undefined;
  private readonly models: string[];

  constructor(options?: { apiKey?: string; models?: string[] }) {
    this.apiKey = options?.apiKey;
    this.models = options?.models ?? [];
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.apiKey) {
      throw new Error(
        `[${this.info.id}] API key not provided. Hosted Gemini provider is unavailable.`
      );
    }

    const adapter = new GeminiModelAdapter({
      apiKey: this.apiKey,
      models: this.models.length > 0 ? this.models : undefined,
    });

    const result = await adapter.generate(request.prompt);

    return {
      text: result.text,
      modelUsed: result.modelUsed,
      provider: result.provider,
      providerClass: 'hosted',
      finishReason: result.finishReason,
    };
  }
}
