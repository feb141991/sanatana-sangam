// Canonical exit-feedback reasons for account deletion. Served to Native and
// the PWA by GET /api/user/delete/preview (`reasons`); clients send back the
// `id`. Labels are English source copy -- clients may show a translation keyed
// by id, falling back to `label` for an id they do not know.
export const DELETION_REASONS = [
  { id: 'taking_break', label: 'Taking a temporary spiritual break' },
  { id: 'too_many_notifications', label: 'Too many notifications or reminders' },
  { id: 'privacy_concerns', label: 'Privacy or data concerns' },
  { id: 'not_useful', label: 'Not finding the practice features helpful' },
  { id: 'technical_issues', label: 'App performance or technical bugs' },
  { id: 'other', label: 'Other reason', requireDetails: true },
] as const;

export type DeletionReasonId = (typeof DELETION_REASONS)[number]['id'];

const MAX_FEEDBACK = 200;

/**
 * Normalises request-body feedback for the admin-review breadcrumb. A known id
 * becomes "Label [id]"; anything else (e.g. an older client sending its own
 * label text) is kept, truncated, and marked [unlisted] so it is never mistaken
 * for a canonical reason. Free text is kept only alongside a reason.
 */
export function describeDeletionFeedback(reason: unknown, detail: unknown): string | null {
  if (typeof reason !== 'string' || !reason.trim()) return null;
  const raw = reason.trim().slice(0, MAX_FEEDBACK);
  const known = DELETION_REASONS.find((r) => r.id === raw);
  const head = known ? `${known.label} [${known.id}]` : `${raw} [unlisted]`;
  const extra = typeof detail === 'string' && detail.trim() ? detail.trim().slice(0, MAX_FEEDBACK) : '';
  return extra ? `${head} (${extra})` : head;
}
