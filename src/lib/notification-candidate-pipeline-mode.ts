/**
 * Global and per-type kill switches and pipeline execution modes for the central
 * notification resolver architecture.
 *
 * All new candidate types default to 'disabled' unless explicitly enabled.
 */

export type CandidatePipelineMode = 'legacy' | 'candidate' | 'disabled';

/**
 * Returns whether the central notification candidate resolver is globally enabled.
 * Defaults to false (kill switch active).
 */
export function isCandidateResolverGloballyEnabled(): boolean {
  return process.env.NOTIFICATION_RESOLVER_ENABLED === 'true';
}

/**
 * Returns the pipeline mode for a specific candidate event type.
 *
 * Resolution order:
 * 1. Specific env override: `NOTIFICATION_CANDIDATE_MODE_<UPPER_SNAKE_EVENT_TYPE>`
 * 2. Defaults to 'disabled' for safety.
 */
export function getCandidateTypePipelineMode(eventType: string): CandidatePipelineMode {
  if (!eventType) return 'disabled';

  const normalized = eventType.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const envKey = `NOTIFICATION_CANDIDATE_MODE_${normalized}`;
  const envVal = process.env[envKey]?.trim().toLowerCase();

  if (envVal === 'candidate') return 'candidate';
  if (envVal === 'legacy') return 'legacy';
  if (envVal === 'disabled') return 'disabled';

  // Default off for all candidate types
  return 'disabled';
}

/**
 * Returns whether a candidate of the given type should be processed by the resolver.
 * Must be globally enabled AND type mode must be 'candidate'.
 */
export function shouldProcessCandidateType(eventType: string): boolean {
  if (!isCandidateResolverGloballyEnabled()) return false;
  return getCandidateTypePipelineMode(eventType) === 'candidate';
}
