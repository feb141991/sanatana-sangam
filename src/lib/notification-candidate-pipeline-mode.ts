/**
 * Global and per-type kill switches and pipeline execution modes for the central
 * notification resolver architecture.
 *
 * All new candidate types default to 'disabled' unless explicitly enabled.
 * Routine migrating types default to 'legacy' until parity is proven and cutover approved.
 */

export type CandidatePipelineMode = 'legacy' | 'candidate' | 'disabled';
export type RoutineReminderType = 'japa' | 'shloka' | 'mood' | 'sattvic' | 'nitya';

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

  // Default off for all new candidate types
  return 'disabled';
}

/**
 * Returns the pipeline mode for an existing routine reminder being migrated.
 * Resolution order:
 * 1. Env override: `NOTIFICATION_ROUTINE_MODE_<UPPER_SNAKE_TYPE>`
 * 2. Defaults to 'legacy' to preserve existing behavior until cutover.
 */
export function getRoutinePipelineMode(routineType: RoutineReminderType): CandidatePipelineMode {
  if (!routineType) return 'legacy';

  const normalized = routineType.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const envKey = `NOTIFICATION_ROUTINE_MODE_${normalized}`;
  const envVal = process.env[envKey]?.trim().toLowerCase();

  if (envVal === 'candidate') return 'candidate';
  if (envVal === 'disabled') return 'disabled';
  if (envVal === 'legacy') return 'legacy';

  // Existing routine reminders default to legacy until cutover
  return 'legacy';
}

/**
 * Returns whether a candidate of the given type should be processed by the resolver.
 * Must be globally enabled AND type mode must be 'candidate'.
 */
export function shouldProcessCandidateType(eventType: string): boolean {
  if (!isCandidateResolverGloballyEnabled()) return false;
  return getCandidateTypePipelineMode(eventType) === 'candidate';
}
