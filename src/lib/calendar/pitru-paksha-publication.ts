/** Exact persisted approval for the 2026 canonical conclusion; no general rule promotion. */
export const PITRU_PAKSHA_APPROVAL_REF = 'founder:pitru-paksha-2026-20260930';
export const PITRU_PAKSHA_APPROVAL_MARKER = 'pitru_approval_20260930013837';

export function isApprovedPitruConclusion(slug: string | null | undefined, input: unknown): boolean {
  if (slug !== 'mahalaya-amavasya' || !input || typeof input !== 'object') return false;
  const row = input as Record<string, unknown>;
  const provenance = row.source_provenance;
  if (!provenance || typeof provenance !== 'object') return false;
  const approval = (provenance as Record<string, unknown>)[PITRU_PAKSHA_APPROVAL_MARKER];
  if (!approval || typeof approval !== 'object'
    || (approval as Record<string, unknown>).review_ref !== PITRU_PAKSHA_APPROVAL_REF) return false;
  return row.date === '2026-10-10' && row.occurrence_date === '2026-10-10'
    && row.year === 2026 && row.calendar_profile === 'legacy-ujjain'
    && row.spiritual_tradition == null && row.variant_key === 'legacy-default'
    && row.computed_latitude === 23.1765 && row.computed_longitude === 75.7885
    && row.computed_timezone === 'Asia/Kolkata' && row.manual_date_override == null
    && row.review_status === 'reviewed' && row.verification_status === 'verified'
    && row.audit_status === 'completed' && row.publication_status === 'published'
    && row.final_date_source !== 'fallback' && Array.isArray(row.source_refs) && row.source_refs.length > 0
    && Array.isArray(row.diagnostics) && row.diagnostics.includes('approved_pitru_journey_20260930013837');
}
