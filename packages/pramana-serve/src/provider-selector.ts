import type { PramanaInferenceProvider } from '@sangam/pramana-core';
import { HostedGeminiProvider } from './providers/hosted-gemini';
import { SelfHostedProvider } from './providers/self-hosted';
import { SarvamProvider } from './providers/sarvam';

// ---------------------------------------------------------------------------
// Provider Registry & Config-Based Selection
// ---------------------------------------------------------------------------

/**
 * Configuration for the Pramana inference provider selector.
 *
 * At the app layer, resolve from environment variables:
 *   PRAMANA_INFERENCE_PROVIDER  — "gemini-hosted" (default) | "self-hosted"
 *   PRAMANA_SELF_HOSTED_URL     — base URL of the private runtime
 *   PRAMANA_SELF_HOSTED_MODEL   — model identifier for the private runtime
 *   PRAMANA_SELF_HOSTED_API_KEY — optional auth token for the private runtime
 *   GEMINI_API_KEY              — API key for the hosted Gemini provider
 */
export interface ProviderSelectorConfig {
  /** Active provider identifier. Default: "gemini-hosted". */
  activeProvider: string;
  /** API key for hosted Gemini provider. */
  geminiApiKey?: string;
  /** API key for hosted Sarvam provider. */
  sarvamApiKey?: string;
  /** Self-hosted runtime base URL, if configured. */
  selfHostedUrl?: string;
  /** Self-hosted model name override. */
  selfHostedModel?: string;
  /** Self-hosted API key / token. */
  selfHostedApiKey?: string;
}

/**
 * Build a provider registry from a given configuration.
 * Returns a Map from provider ID → instantiated adapter.
 */
export function buildProviderRegistry(
  config: ProviderSelectorConfig
): Map<string, PramanaInferenceProvider> {
  const registry = new Map<string, PramanaInferenceProvider>();

  // Always register the hosted Gemini provider
  registry.set('gemini-hosted', new HostedGeminiProvider({
    apiKey: config.geminiApiKey,
  }));

  // Register the Sarvam hosted provider
  registry.set('sarvam-hosted', new SarvamProvider({
    apiKey: config.sarvamApiKey,
  }));

  // Register the self-hosted provider if a URL is configured
  if (config.selfHostedUrl) {
    registry.set(
      'self-hosted',
      new SelfHostedProvider({
        baseUrl: config.selfHostedUrl,
        model: config.selfHostedModel,
        apiKey: config.selfHostedApiKey,
      })
    );
  } else {
    // Register an unconfigured stub so the selector can report it
    registry.set('self-hosted', new SelfHostedProvider());
  }

  return registry;
}

/**
 * Select the active inference provider based on configuration.
 *
 * Resolution order:
 *   1. Requested provider ID from config.activeProvider
 *   2. Fallback to "gemini-hosted" if the requested provider is unavailable
 */
export function selectProvider(
  config: ProviderSelectorConfig
): PramanaInferenceProvider {
  const providers = selectProviders(config);
  if (providers.length > 0) {
    return providers[0];
  }
  throw new Error(`No available Pramana inference provider.`);
}

/**
 * Returns a prioritized array of inference providers for failover.
 * The primary provider is first. The fallback provider is second.
 */
export function selectProviders(
  config: ProviderSelectorConfig
): PramanaInferenceProvider[] {
  const registry = buildProviderRegistry(config);
  const providers: PramanaInferenceProvider[] = [];

  const requested = registry.get(config.activeProvider);
  if (requested && requested.isAvailable()) {
    providers.push(requested);
  }

  // Fallback to hosted Gemini if it's not already the requested one
  const fallback = registry.get('gemini-hosted');
  if (fallback && fallback.isAvailable() && config.activeProvider !== 'gemini-hosted') {
    providers.push(fallback);
  }

  if (providers.length === 0) {
    throw new Error(
      `No available Pramana inference provider. ` +
      `Requested: "${config.activeProvider}". ` +
      `Ensure geminiApiKey or selfHostedUrl is configured.`
    );
  }

  return providers;
}

/**
 * Report the status of all registered providers.
 * Useful for diagnostics, health checks, and admin tooling.
 */
export function getProviderStatus(
  config: ProviderSelectorConfig
): Array<{ id: string; displayName: string; providerClass: string; available: boolean; active: boolean }> {
  const registry = buildProviderRegistry(config);
  const results: Array<{ id: string; displayName: string; providerClass: string; available: boolean; active: boolean }> = [];

  for (const [id, provider] of registry) {
    results.push({
      id,
      displayName: provider.info.displayName,
      providerClass: provider.info.providerClass,
      available: provider.isAvailable(),
      active: id === config.activeProvider && provider.isAvailable(),
    });
  }

  return results;
}
