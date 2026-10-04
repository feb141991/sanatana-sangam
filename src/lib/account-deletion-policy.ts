// One shared deletion cool-off policy for API routes, workflow, purge, and
// email copy. Keeping these pure lets the email worker format notices without
// importing account-deletion storage operations.
export const ACCOUNT_DELETION_COOL_OFF_DAYS = 30;

export function purgeAfterFromRequestedAt(deletionRequestedAt: string): string {
  return new Date(
    new Date(deletionRequestedAt).getTime() + ACCOUNT_DELETION_COOL_OFF_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}
