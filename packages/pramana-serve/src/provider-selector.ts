import type { PramanaInferenceProvider } from '@sangam/pramana-core';
import { SelfHostedProvider } from './providers/self-hosted';
import { SarvamProvider } from './providers/sarvam';

// ---------------------------------------------------------------------------
// Provider Registry & Config-Based Selection
// ---------------------------------------------------------------------------

/**
 * Configuration for the Pramana inference provider selector.
 *
 * At the app layer, resolve from environment variables:
 *   PRAMANA_INFERENCE_PROVIDER  — "sarvam-hosted" (default) | "self-hosted"
 *   PRAMANA_SELF_HOSTED_URL     — base URL of the private runtime
 *   PRAMANA_SELF_HOSTED_MODEL   — model identifier for the private runtime
 *   PRAMANA_SELF_HOSTED_API_KEY — optional auth token for the private runtime
 *   SARVAM_API_KEY              — API key for the hosted Sarvam provider
 */
export interface ProviderSelectorConfig {
  /** Active provider identifier. Default: "sarvam-hosted". */
  activeProvider: string;
  /** API key for hosted Sarvam provider. */
  sarvamApiKey?: string;
  /** Hosted Sarvam model override. */
  sarvamModel?: string;
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

  // Register the Sarvam hosted provider
  registry.set('sarvam-hosted', new SarvamProvider({
    apiKey: config.sarvamApiKey,
    model: config.sarvamModel,
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
 *   2. Fallback to "sarvam-hosted" if the requested provider is unavailable
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
  const seen = new Set<string>();

  const addProvider = (id: string) => {
    const provider = registry.get(id);
    if (!provider || !provider.isAvailable() || seen.has(id)) return;
    providers.push(provider);
    seen.add(id);
  };

  addProvider(config.activeProvider);

  const fallbackOrder = config.activeProvider === 'sarvam-hosted'
    ? ['self-hosted']
    : config.activeProvider === 'self-hosted'
      ? ['sarvam-hosted']
      : ['sarvam-hosted', 'self-hosted'];

  for (const id of fallbackOrder) {
    addProvider(id);
  }

  if (providers.length === 0) {
    throw new Error(
      `No available Pramana inference provider. ` +
      `Requested: "${config.activeProvider}". ` +
      `Ensure SARVAM_API_KEY or selfHostedUrl is configured.`
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
