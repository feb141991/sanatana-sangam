import { selectProvider, selectProviders } from '@sangam/pramana-serve';
import type { PramanaInferenceProvider, InferenceRequest, InferenceResponse } from '@sangam/pramana-core';
import type { AIPromptSpec, AITextResult } from '@/lib/ai/contracts';
import { isCircuitOpen, recordSuccess, recordFailure } from '@/lib/monitoring/circuit-breaker';
import { emitError } from '@/lib/monitoring/events';

// ---------------------------------------------------------------------------
// App-facing inference adapter
// ---------------------------------------------------------------------------

let _cachedProviders: PramanaInferenceProvider[] | null = null;

/**
 * Reads provider configuration from environment variables.
 * This is the ONLY place where process.env is read for inference config.
 */
function readEnvConfig() {
  return {
    activeProvider: process.env.PRAMANA_INFERENCE_PROVIDER?.trim() || 'sarvam-hosted',
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
    sarvamApiKey: process.env.SARVAM_API_KEY?.trim() || undefined,
    sarvamModel: process.env.PRAMANA_SARVAM_MODEL?.trim() || undefined,
    selfHostedUrl: process.env.PRAMANA_SELF_HOSTED_URL?.trim() || undefined,
    selfHostedModel: process.env.PRAMANA_SELF_HOSTED_MODEL?.trim() || undefined,
    selfHostedApiKey: process.env.PRAMANA_SELF_HOSTED_API_KEY?.trim() || undefined,
  };
}

type InferenceProviderOverride =
  | 'gemini-hosted'
  | 'sarvam-hosted'
  | 'self-hosted';

/**
 * Returns the active inference providers, resolved from environment config.
 * The result is cached for the lifetime of the process to avoid repeated
 * environment reads.
 */
export function getInferenceProviders(
  providerOverride?: InferenceProviderOverride
): PramanaInferenceProvider[] {
  if (providerOverride === 'sarvam-hosted') {
    // Sarvam-only — no Gemini fallback
    const providers = selectProviders({ ...readEnvConfig(), activeProvider: 'sarvam-hosted' });
    return providers.filter(p => p.info.id === 'sarvam-hosted');
  }
  if (providerOverride) {
    return selectProviders({ ...readEnvConfig(), activeProvider: providerOverride });
  }

  if (!_cachedProviders) {
    _cachedProviders = selectProviders(readEnvConfig());
  }
  return _cachedProviders;
}

/**
 * For backward compatibility when a single provider is strictly needed.
 */
export function getInferenceProvider(): PramanaInferenceProvider {
  return getInferenceProviders()[0];
}

/**
 * Reset the cached provider (useful for testing or config reload).
 */
export function resetInferenceProvider(): void {
  _cachedProviders = null;
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
  options?: {
    responseFormat?: 'text' | 'json';
    providerOverride?: InferenceProviderOverride;
  }
): Promise<AITextResult> {
  const providers = getInferenceProviders(options?.providerOverride);
  const request: InferenceRequest = {
    prompt,
    responseFormat: options?.responseFormat,
  };

  const breakerConfig = { failureThreshold: 5, cooldownMs: 60000 };
  let lastError: Error | null = null;

  const isProviderFailure = (err: any) => {
    const message = String(err?.message || '');
    const parsedStatus = message.match(/HTTP\s+(\d{3})\b/i)?.[1];
    const status = Number(err?.status || err?.statusCode || parsedStatus || 0);
    return (
      err?.code === 'OUTPUT_TRUNCATED' ||
      err?.code === 'NO_FINAL_ANSWER' ||
      err?.name === 'PramanaOutputTruncatedError' ||
      err?.name === 'PramanaNoFinalAnswerError' ||
      status === 401 ||
      status === 403 ||
      status === 404 ||
      status === 408 ||
      status === 409 ||
      status === 429 ||
      status >= 500 ||
      err?.name === 'TimeoutError' ||
      err?.code === 'ECONNREFUSED' ||
      /No response generated/i.test(message) ||
      /No final answer/i.test(message) ||
      /Output truncated/i.test(message) ||
      /Malformed response/i.test(message) ||
      /missing usable assistant text/i.test(message) ||
      /model.*not found/i.test(message) ||
      /not_found_error/i.test(message) ||
      /forbidden/i.test(message) ||
      /unauthori[sz]ed/i.test(message) ||
      /overloaded/i.test(message) ||
      /temporarily unavailable/i.test(message)
    );
  };

  for (const provider of providers) {
    const providerId = provider.info.id;
    
    if (isCircuitOpen(providerId, breakerConfig)) {
      continue;
    }

    try {
      const response: InferenceResponse = await provider.generate(request);
      recordSuccess(providerId);
      
      return {
        text: response.text,
        modelUsed: response.modelUsed,
        provider: response.provider,
        finishReason: response.finishReason,
      };
    } catch (err: any) {
      lastError = err;
      const isUpstreamFailure = isProviderFailure(err);
      
      if (isUpstreamFailure) {
        recordFailure(providerId, err.message, breakerConfig);
        emitError('ai', err, 'P1', { provider: providerId, context: { action: 'provider_failover' }});
        // Continue to the next fallback provider
      } else {
        // A client error (e.g. 400 Bad Request) means the payload is wrong. Don't retry this on another provider.
        throw err;
      }
    }
  }

  throw lastError || new Error('All inference providers failed or were circuit-broken.');
}
