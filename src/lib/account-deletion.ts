// Single source of truth for the account-deletion cool-off window, shared by
// the request/cancel/status API routes (src/app/api/user/delete/*) and the
// purge cron (src/app/api/cron/purge-deleted-accounts/route.ts) so the
// window promised to the user in copy always matches what the cron actually
// enforces.
export const ACCOUNT_DELETION_COOL_OFF_DAYS = 30;

export function purgeAfterFromRequestedAt(deletionRequestedAt: string): string {
  return new Date(
    new Date(deletionRequestedAt).getTime() + ACCOUNT_DELETION_COOL_OFF_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}
