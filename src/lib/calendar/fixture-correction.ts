/** Input guard for an admin-supplied candidate date. Approval remains separate. */
export function validateFixtureCorrection(patch: unknown, expectedUpdatedAt: unknown): string | null {
  if (typeof expectedUpdatedAt !== 'string' || !Number.isFinite(Date.parse(expectedUpdatedAt))) {
    return 'Correction requires the current fixture version.';
  }
  return validateDateCandidate(patch);
}

export function validateDateCandidate(patch: unknown): string | null {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return 'Correction requires a sourced expected date.';
  const record = patch as Record<string, unknown>;
  const expected = record.expected;
  const source = record.source;
  if (!expected || typeof expected !== 'object' || Array.isArray(expected) ||
    !source || typeof source !== 'object' || Array.isArray(source)) {
    return 'Correction requires a sourced expected date.';
  }
  const civilDate = (expected as Record<string, unknown>).civilDate;
  const sourceRecord = source as Record<string, unknown>;
  const parsed = typeof civilDate === 'string' ? new Date(`${civilDate}T00:00:00Z`) : null;
  if (typeof civilDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(civilDate) ||
    !parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== civilDate) {
    return 'Proposed civil date must be a real YYYY-MM-DD date.';
  }
  if (typeof sourceRecord.ref !== 'string' || sourceRecord.ref.length > 2048 || !/^https:\/\/[^\s]+$/i.test(sourceRecord.ref)) {
    return 'Proposed date requires an HTTPS source URL.';
  }
  if (typeof sourceRecord.citation !== 'string' || sourceRecord.citation.trim().length < 12 || sourceRecord.citation.length > 500 ||
    typeof record.reasoning !== 'string' || record.reasoning.trim().length < 12 || record.reasoning.length > 1000) {
    return 'Proposed date requires a precise citation and rationale.';
  }
  if (typeof sourceRecord.tier !== 'number' || ![1, 2, 3, 4].includes(sourceRecord.tier)) {
    return 'Select a recognized source tier.';
  }
  return null;
}
