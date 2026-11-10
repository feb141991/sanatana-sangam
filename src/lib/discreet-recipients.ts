import type { SupabaseClient } from '@supabase/supabase-js';

const LOOKUP_BATCH_SIZE = 500;

/** What a person with "Hide notification details" switched on sees on their lock screen instead of the real text. */
export const DISCREET_PUSH_COPY = {
  title: 'Shoonaya',
  body: 'You have a new notification.',
} as const;

/**
 * Types whose text is never replaced. A security notice has to say what happened; it names no practice, content or
 * person from the app. Everything else, including every devotional, family, health-adjacent and community message,
 * is replaced when the person asked for discretion.
 */
export const DISCREET_EXEMPT_TYPES: readonly string[] = ['security'];

export type DiscreetRecipientsResult = {
  /** Accounts that switched discretion on. */
  discreetUserIds: Set<string>;
  /**
   * True when the lookup FAILED (not when the column is missing). The caller must then treat everyone as discreet:
   * showing a private message in full because a lookup failed is the worse mistake.
   */
  lookupFailed: boolean;
  error: { message: string } | null;
};

/** Postgres "undefined column": the migration adding notification_discreet_mode has not been applied yet. */
const UNDEFINED_COLUMN = '42703';

export async function findDiscreetUserIds(supabase: SupabaseClient, userIds: string[]): Promise<DiscreetRecipientsResult> {
  const discreetUserIds = new Set<string>();
  const unique = Array.from(new Set(userIds.filter(Boolean)));

  for (let start = 0; start < unique.length; start += LOOKUP_BATCH_SIZE) {
    const batch = unique.slice(start, start + LOOKUP_BATCH_SIZE);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .in('id', batch)
      .eq('notification_discreet_mode', true);

    if (error) {
      // Before the migration nobody can have asked for discretion, so a missing column is an empty answer, not a failure.
      if ((error as { code?: string }).code === UNDEFINED_COLUMN) return { discreetUserIds: new Set(), lookupFailed: false, error: null };
      return { discreetUserIds: new Set(), lookupFailed: true, error: { message: error.message } };
    }
    for (const row of (data ?? []) as Array<{ id: string }>) discreetUserIds.add(row.id);
  }

  return { discreetUserIds, lookupFailed: false, error: null };
}

/** Whether this push, for this recipient, must carry the neutral text. */
export function shouldShowDiscreetCopy(
  messageType: string,
  userId: string,
  result: Pick<DiscreetRecipientsResult, 'discreetUserIds' | 'lookupFailed'>,
): boolean {
  if (DISCREET_EXEMPT_TYPES.includes(messageType.trim().toLowerCase())) return false;
  return result.lookupFailed || result.discreetUserIds.has(userId);
}
