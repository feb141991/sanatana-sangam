import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ACCOUNT_DELETION_COOL_OFF_DAYS, purgeAfterFromRequestedAt } from '@/lib/account-deletion-policy';
import { enqueueShoonayaEmail, type EnqueueEmailInput } from '@/lib/email-outbox';
import { buildDeletionNotice, dueDeletionReminder, type DeletionNoticeKind } from '@/lib/account-deletion-email';

export { buildDeletionNotice, dueDeletionReminder } from '@/lib/account-deletion-email';
export type { DeletionNoticeKind } from '@/lib/account-deletion-email';

type EnqueueEmail = (input: EnqueueEmailInput) => Promise<'queued' | 'already_queued'>;
type QueueOutcome = 'queued' | 'already_queued' | 'not_pending' | 'no_email' | 'failed';

/** Queues a final receipt after profile and auth-user deletion have succeeded. */
export async function enqueueDeletionCompletedNotice(
  userId: string,
  email: string,
  enqueue: EnqueueEmail = enqueueShoonayaEmail,
): Promise<'queued' | 'already_queued' | 'failed'> {
  try {
    const privacyKey = process.env.EMAIL_SUPPRESSION_HMAC_KEY;
    if (!privacyKey) throw new Error('email_suppression_key_not_configured');
    const dedupeDigest = createHmac('sha256', privacyKey).update(`account-deletion-completed:${userId}`).digest('hex');
    return await enqueue({
      idempotencyKey: `account-deletion-completed:${dedupeDigest}`,
      to: email,
      // The account is already gone. Keep the recipient address only until
      // provider acceptance, with no deleted profile lookup or retained user id.
      recipientUserId: null,
      templateKey: 'account_deletion',
      emailClass: 'transactional',
      content: { shloka: '', meaning: '', ...buildDeletionNotice('completed') },
      priority: 10,
    });
  } catch (error) {
    console.error('[account-deletion-notices] completion receipt enqueue failed:', error instanceof Error ? error.message : 'unknown');
    return 'failed';
  }
}

/**
 * Queues a deletion notice only while this exact deletion request is active.
 * The queue's unique idempotency key replaces the old claim/send/release race;
 * provider delivery and retry are owned by the email-outbox worker.
 */
export async function enqueueDeletionNotice(
  admin: SupabaseClient,
  input: { userId: string; deletionRequestedAt: string; kind: DeletionNoticeKind },
  enqueue: EnqueueEmail = enqueueShoonayaEmail,
): Promise<QueueOutcome> {
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

    const canonicalRequestAt = new Date(input.deletionRequestedAt).toISOString();
    const message = buildDeletionNotice(input.kind, input.deletionRequestedAt);
    return await enqueue({
      idempotencyKey: `account-deletion:${input.userId}:${canonicalRequestAt}:${input.kind}`,
      to: email,
      recipientUserId: input.userId,
      templateKey: 'account_deletion',
      emailClass: 'transactional',
      content: { shloka: '', meaning: '', ...message },
      context: { deletionRequestedAt: canonicalRequestAt },
      priority: 10,
    });
  } catch (error) {
    console.error('[account-deletion-notices] enqueue failed:', error instanceof Error ? error.message : 'unknown');
    return 'failed';
  }
}

/** Daily: enqueue due 7-day / 1-day reminders for still-pending deletions. */
export async function enqueueDueDeletionReminders(
  admin: SupabaseClient,
  now = Date.now(),
  enqueue: EnqueueEmail = enqueueShoonayaEmail,
) {
  const earliest = new Date(now - ACCOUNT_DELETION_COOL_OFF_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const latest = new Date(now - (ACCOUNT_DELETION_COOL_OFF_DAYS - 7) * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('profiles')
    .select('id, deletion_requested_at')
    .eq('is_deleting', true)
    .gt('deletion_requested_at', earliest)
    .lte('deletion_requested_at', latest);
  if (error) return { checked: 0, queued: 0, alreadyQueued: 0, failed: 0, error: error.message };

  let queued = 0;
  let alreadyQueued = 0;
  let failed = 0;
  const rows = (data ?? []) as Array<{ id: string; deletion_requested_at: string | null }>;
  for (const row of rows) {
    if (!row.deletion_requested_at) continue;
    const kind = dueDeletionReminder(purgeAfterFromRequestedAt(row.deletion_requested_at), now);
    if (!kind) continue;
    const outcome = await enqueueDeletionNotice(admin, {
      userId: row.id,
      deletionRequestedAt: row.deletion_requested_at,
      kind,
    }, enqueue);
    if (outcome === 'queued') queued += 1;
    if (outcome === 'already_queued') alreadyQueued += 1;
    if (outcome === 'failed') failed += 1;
  }
  return { checked: rows.length, queued, alreadyQueued, failed, error: null };
}
