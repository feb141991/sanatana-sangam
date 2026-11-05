import { hashEmailAddress } from '@/lib/email-outbox';

export type EmailSuppressionOutcome = 'clear' | 'suppressed' | 'unavailable';

type SuppressionClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => { maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }> };
    };
  };
};

/**
 * Has this address bounced or complained (the Resend webhook records it as a hash in email_suppressions)? Both mail paths must ask before
 * sending: the outbox always did, the campaign dispatcher did not.
 *
 * Fails CLOSED, and distinguishes "do not send, ever" (suppressed) from "could not find out, try again" (unavailable): a missing hash key
 * or a failed lookup must not send, and must not permanently mark an address as suppressed either.
 */
export async function checkEmailSuppression(client: unknown, email: string | null | undefined): Promise<EmailSuppressionOutcome> {
  if (!email) return 'unavailable';
  let hash: string;
  try {
    hash = hashEmailAddress(email);
  } catch {
    return 'unavailable';
  }
  try {
    const { data, error } = await (client as SuppressionClient)
      .from('email_suppressions')
      .select('email_hash')
      .eq('email_hash', hash)
      .maybeSingle();
    if (error) return 'unavailable';
    return data ? 'suppressed' : 'clear';
  } catch {
    return 'unavailable';
  }
}
