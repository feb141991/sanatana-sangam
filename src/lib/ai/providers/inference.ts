import { selectProvider } from '@sangam/pramana-serve';
import type { PramanaInferenceProvider, InferenceRequest, InferenceResponse } from '@sangam/pramana-core';
import type { AIPromptSpec, AITextResult } from '@/lib/ai/contracts';

// ---------------------------------------------------------------------------
// App-facing inference adapter
// ---------------------------------------------------------------------------

let _cachedProvider: PramanaInferenceProvider | null = null;

/**
 * Reads provider configuration from environment variables.
 * This is the ONLY place where process.env is read for inference config.
 */
function readEnvConfig() {
  return {
    activeProvider: process.env.PRAMANA_INFERENCE_PROVIDER?.trim() || 'gemini-hosted',
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
    sarvamApiKey: process.env.SARVAM_API_KEY?.trim() || undefined,
    selfHostedUrl: process.env.PRAMANA_SELF_HOSTED_URL?.trim() || undefined,
    selfHostedModel: process.env.PRAMANA_SELF_HOSTED_MODEL?.trim() || undefined,
    selfHostedApiKey: process.env.PRAMANA_SELF_HOSTED_API_KEY?.trim() || undefined,
  };
}

/**
 * Returns the active inference provider, resolved from environment config.
 * The result is cached for the lifetime of the process to avoid repeated
 * environment reads.
 */
export function getInferenceProvider(): PramanaInferenceProvider {
  if (!_cachedProvider) {
    _cachedProvider = selectProvider(readEnvConfig());
  }
  return _cachedProvider;
}

/**
 * Reset the cached provider (useful for testing or config reload).
 */
export function resetInferenceProvider(): void {
  _cachedProvider = null;
}

/**
 * Generate text using the active Pramana inference provider.
 *
 * This function serves as the primary inference entry point for all
 * app-level route handlers. It normalises the response into the
 * existing AITextResult shape so no downstream code needs to change.
 */
export async function generateWithProvider(
  prompt: AIPromptSpec,
  options?: { responseFormat?: 'text' | 'json' }
): Promise<AITextResult> {
  const provider = getInferenceProvider();

  const request: InferenceRequest = {
    prompt,
    responseFormat: options?.responseFormat,
  };

  const response: InferenceResponse = await provider.generate(request);

  return {
    text: response.text,
    modelUsed: response.modelUsed,
    provider: response.provider,
    finishReason: response.finishReason,
  };
}
