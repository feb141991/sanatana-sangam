import type { SupabaseClient } from '@supabase/supabase-js';

import { ACCOUNT_DELETION_COOL_OFF_DAYS, purgeAfterFromRequestedAt } from '@/lib/account-deletion';
import { APP } from '@/lib/config';
import { sendShoonayaEmail } from '@/lib/email';

// Account-deletion emails: a confirmation when deletion is scheduled and
// reminders 7 days and 1 day before the purge. Transactional (about the
// user's own account), so not gated on marketing opt-ins and allowed while
// is_deleting is true. Each is sent at most once per deletion request via the
// account_deletion_notices ledger (migration 20261003150400). No scripture or
// spiritual content -- plain account information only.

export type DeletionNoticeKind = 'scheduled' | 'reminder_7d' | 'reminder_1d';

const DAY_MS = 24 * 60 * 60 * 1000;

type SendEmail = (options: Parameters<typeof sendShoonayaEmail>[0]) => Promise<{ success: boolean } | undefined | unknown>;

/** Which reminder is due, if any, for a purge at `purgeAfter` as of `now`. */
export function dueDeletionReminder(purgeAfter: string, now: number): Exclude<DeletionNoticeKind, 'scheduled'> | null {
  const msLeft = new Date(purgeAfter).getTime() - now;
  if (!(msLeft > 0)) return null;
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  if (daysLeft <= 1) return 'reminder_1d';
  if (daysLeft <= 7) return 'reminder_7d';
  return null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function buildDeletionNotice(kind: DeletionNoticeKind, deletionRequestedAt: string) {
  const purgeDate = formatDate(purgeAfterFromRequestedAt(deletionRequestedAt));
  const cancelHow = 'To keep your account, sign in to Shoonaya and tap "Cancel deletion" on your Profile or in Settings before then. Everything will be restored.';
  const notYou = "If you didn't ask to delete your account, sign in and cancel now.";
  const ctaUrl = `${APP.BASE_URL}/profile`;

  if (kind === 'scheduled') {
    return {
      subject: 'Your Shoonaya account is scheduled for deletion',
      title: 'Account deletion scheduled',
      body: `We received a request to delete your Shoonaya account on ${formatDate(deletionRequestedAt)}. Reminders have stopped and nothing is deleted yet. Your account and data will be permanently deleted on ${purgeDate} (after ${ACCOUNT_DELETION_COOL_OFF_DAYS} days). ${cancelHow} ${notYou}`,
      ctaText: 'Keep my account',
      ctaUrl,
    };
  }
  const when = kind === 'reminder_1d' ? 'tomorrow' : 'in 7 days';
  return {
    subject: `Your Shoonaya account will be deleted ${when}`,
    title: `Account deletion ${when}`,
    body: `Your Shoonaya account and data will be permanently deleted on ${purgeDate}. This cannot be undone afterwards. ${cancelHow} ${notYou}`,
    ctaText: 'Keep my account',
    ctaUrl,
  };
}

/**
 * Sends one notice if it has not been sent for this deletion request and the
 * request is still pending. Returns what happened; never throws.
 */
export async function sendDeletionNotice(
  admin: SupabaseClient,
  input: { userId: string; deletionRequestedAt: string; kind: DeletionNoticeKind },
  send: SendEmail = sendShoonayaEmail,
): Promise<'sent' | 'already_sent' | 'not_pending' | 'no_email' | 'failed'> {
  try {
    const { data: pending, error: pendingError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', input.userId)
      .eq('is_deleting', true)
      .eq('deletion_requested_at', input.deletionRequestedAt)
      .maybeSingle();
    if (pendingError) return 'failed';
    if (!pending) return 'not_pending';

    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(input.userId);
    if (authError) return 'failed';
    const email = authUser?.user?.email;
    if (!email) return 'no_email';

    // Claim first; the primary key makes a concurrent or repeated claim a no-op.
    const { data: claimed, error: claimError } = await admin
      .from('account_deletion_notices')
      .upsert(
        { user_id: input.userId, deletion_requested_at: input.deletionRequestedAt, kind: input.kind },
        { onConflict: 'user_id,deletion_requested_at,kind', ignoreDuplicates: true },
      )
      .select('user_id');
    if (claimError) return 'failed';
    if (!claimed || claimed.length === 0) return 'already_sent';

    const message = buildDeletionNotice(input.kind, input.deletionRequestedAt);
    const result = await send({ to: email, shloka: '', meaning: '', ...message });
    const ok = !!result && typeof result === 'object' && (result as { success?: unknown }).success === true;
    if (!ok) {
      // Release the claim so the next run retries.
      await admin
        .from('account_deletion_notices')
        .delete()
        .eq('user_id', input.userId)
        .eq('deletion_requested_at', input.deletionRequestedAt)
        .eq('kind', input.kind);
      return 'failed';
    }
    return 'sent';
  } catch (error) {
    console.error('[account-deletion-notices] send failed:', error instanceof Error ? error.message : error);
    return 'failed';
  }
}

/** Daily: sends any due 7-day / 1-day reminders for pending deletions. */
export async function sendDueDeletionReminders(admin: SupabaseClient, now = Date.now(), send: SendEmail = sendShoonayaEmail) {
  const earliest = new Date(now - ACCOUNT_DELETION_COOL_OFF_DAYS * DAY_MS).toISOString();
  const latest = new Date(now - (ACCOUNT_DELETION_COOL_OFF_DAYS - 7) * DAY_MS).toISOString();
  const { data, error } = await admin
    .from('profiles')
    .select('id, deletion_requested_at')
    .eq('is_deleting', true)
    .gt('deletion_requested_at', earliest)
    .lte('deletion_requested_at', latest);
  if (error) return { checked: 0, sent: 0, failed: 0, error: error.message };

  let sent = 0;
  let failed = 0;
  const rows = (data ?? []) as Array<{ id: string; deletion_requested_at: string | null }>;
  for (const row of rows) {
    if (!row.deletion_requested_at) continue;
    const kind = dueDeletionReminder(purgeAfterFromRequestedAt(row.deletion_requested_at), now);
    if (!kind) continue;
    const outcome = await sendDeletionNotice(admin, { userId: row.id, deletionRequestedAt: row.deletion_requested_at, kind }, send);
    if (outcome === 'sent') sent += 1;
    if (outcome === 'failed') failed += 1;
  }
  return { checked: rows.length, sent, failed, error: null };
}
