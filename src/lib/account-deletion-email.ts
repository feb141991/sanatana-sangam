import { ACCOUNT_DELETION_COOL_OFF_DAYS, purgeAfterFromRequestedAt } from '@/lib/account-deletion-policy';
import { APP } from '@/lib/config';

export type DeletionNoticeKind = 'scheduled' | 'reminder_7d' | 'reminder_1d' | 'completed';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Which reminder is due, if any, for a purge at `purgeAfter` as of `now`. */
export function dueDeletionReminder(purgeAfter: string, now: number): 'reminder_7d' | 'reminder_1d' | null {
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

export function buildDeletionNotice(kind: DeletionNoticeKind, deletionRequestedAt?: string) {
  const ctaUrl = `${APP.BASE_URL}/profile`;

  if (kind === 'completed') {
    return {
      subject: 'Your Shoonaya account has been deleted',
      title: 'Account deletion complete',
      body: 'Your Shoonaya account and associated personal profile data have been deleted. This receipt confirms the deletion request completed; records that must be retained for security, legal, or operational reasons may remain only as required.',
      ctaText: 'Visit Shoonaya',
      ctaUrl: APP.BASE_URL,
    };
  }

  if (!deletionRequestedAt) throw new Error('deletion_request_timestamp_required');
  const purgeDate = formatDate(purgeAfterFromRequestedAt(deletionRequestedAt));
  const cancelHow = 'To keep your account, sign in to Shoonaya and tap "Cancel deletion" on your Profile or in Settings before then. Everything will be restored.';
  const notYou = "If you didn't ask to delete your account, sign in and cancel now.";

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
