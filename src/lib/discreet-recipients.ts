import type { SupabaseClient } from '@supabase/supabase-js';

const LOOKUP_BATCH_SIZE = 500;

/** Push copy for people who hide notification details. */
export const DISCREET_PUSH_COPY = {
  title: 'Shoonaya',
  body: 'You have a new notification.',
} as const;

// Security notices carry instructions but no practice, family or community details.
const DISCREET_EXEMPT_TYPES: readonly string[] = ['security'];

type DiscretionLookup = { visibleUserIds: Set<string>; lookupFailed: boolean };

/** Full text is allowed only for an account whose preference is explicitly off. */
export async function findFullTextPushRecipients(supabase: SupabaseClient, userIds: string[]): Promise<DiscretionLookup> {
  const visibleUserIds = new Set<string>();
  const unique = Array.from(new Set(userIds.filter(Boolean)));

  try {
    for (let start = 0; start < unique.length; start += LOOKUP_BATCH_SIZE) {
      const batch = unique.slice(start, start + LOOKUP_BATCH_SIZE);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, notification_discreet_mode')
        .in('id', batch);

      if (error || !Array.isArray(data)) return { visibleUserIds: new Set(), lookupFailed: true };
      for (const row of data) {
        if (row.notification_discreet_mode === false) visibleUserIds.add(row.id);
      }
    }
  } catch {
    return { visibleUserIds: new Set(), lookupFailed: true };
  }
  return { visibleUserIds, lookupFailed: false };
}

export function shouldShowDiscreetCopy(messageType: string, userId: string, result: DiscretionLookup): boolean {
  return !DISCREET_EXEMPT_TYPES.includes(messageType.trim().toLowerCase())
    && (result.lookupFailed || !result.visibleUserIds.has(userId));
}
