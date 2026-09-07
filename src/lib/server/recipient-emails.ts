/**
 * Recipient email resolution, shared by every server-side sender (festival-email
 * cron, marketing dispatcher, and anything added later).
 *
 * `profiles` and its sanitized projection `public_profiles` carry no `email` column
 * (verified directly against the live schema, not just generated types) -- email only
 * exists on Supabase's built-in `auth.users`, which a plain PostgREST
 * `.from('profiles')` query can never reach. `public.get_recipient_emails` (added by
 * the marketing_pipeline migration) is a narrow, service-role-only SECURITY DEFINER
 * function: it returns emails only for IDs the caller already selected via its own
 * profiles-based eligibility query, never a bulk `auth.users` read.
 */
export interface RecipientEmailMap {
  [userId: string]: string;
}

export async function resolveRecipientEmails(supabase: any, userIds: string[]): Promise<RecipientEmailMap> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase.rpc("get_recipient_emails", { p_user_ids: uniqueIds });
  if (error) {
    throw new Error(`Failed to resolve recipient emails: ${error.message}`);
  }

  const map: RecipientEmailMap = {};
  for (const row of (data ?? []) as Array<{ id: string; email: string | null }>) {
    if (row.email) {
      map[row.id] = row.email;
    }
  }
  return map;
}
