import { createHmac, randomUUID } from 'node:crypto';

import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { sendShoonayaEmail, sendShoonayaHtmlEmail, type EmailOptions } from '@/lib/email';
import { buildDeletionNotice } from '@/lib/account-deletion-email';
import type { Database, Json } from '@/types/database';

export type EmailOutboxTemplate =
  | 'waitlist_welcome'
  | 'onboarding_welcome'
  | 'kul_invite'
  | 'festival_reminder'
  | 'account_deletion'
  | 'new_device_login';

type EmailOutboxRow = Database['public']['Tables']['email_outbox']['Row'];
type EmailClass = EmailOutboxRow['email_class'];
type MarketingCategory = Exclude<EmailOutboxRow['marketing_category'], null>;
// The checked-in Database type is intentionally partial and can resolve new
// tables/RPCs to `never`; the service-role helper uses SupabaseClient<any> for
// those migrations until generated types are refreshed.
type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>;

type PremiumContent = Omit<EmailOptions, 'to'>;
type HtmlContent = { subject: string; html: string; from?: string };

export type EnqueueEmailInput = {
  idempotencyKey: string;
  to: string;
  recipientUserId?: string | null;
  templateKey: EmailOutboxTemplate;
  emailClass: EmailClass;
  marketingCategory?: MarketingCategory;
  content: PremiumContent | HtmlContent;
  context?: Record<string, Json>;
  priority?: number;
  availableAt?: string;
};

export type EmailOutboxRunResult = {
  claimed: number;
  sent: number;
  suppressed: number;
  retried: number;
  dead: number;
  failed: number;
};

function isRecord(value: Json): value is { [key: string]: Json } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: Json | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function hashEmailAddress(value: string, secret = process.env.EMAIL_SUPPRESSION_HMAC_KEY): string {
  if (!secret) throw new Error('email_suppression_key_not_configured');
  return createHmac('sha256', secret).update(normalizedEmail(value)).digest('hex');
}

function buildStoredPayload(input: EnqueueEmailInput): Json {
  const content = input.content;
  const payload: Record<string, Json> = 'html' in content
    ? {
        subject: content.subject,
        html: content.html,
        ...(content.from ? { from: content.from } : {}),
      }
    : {
        subject: content.subject,
        shloka: content.shloka,
        meaning: content.meaning,
        title: content.title,
        body: content.body,
        ctaText: content.ctaText,
        ctaUrl: content.ctaUrl,
        ...(content.unsubUrl ? { unsubUrl: content.unsubUrl } : {}),
        ...(content.unsubType ? { unsubType: content.unsubType } : {}),
      };
  if (input.context) Object.assign(payload, input.context);
  return payload;
}

export async function enqueueShoonayaEmail(input: EnqueueEmailInput): Promise<'queued' | 'already_queued'> {
  const admin = createServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from('email_outbox')
    .upsert({
      idempotency_key: input.idempotencyKey,
      recipient_email: normalizedEmail(input.to),
      recipient_user_id: input.recipientUserId ?? null,
      template_key: input.templateKey,
      email_class: input.emailClass,
      marketing_category: input.marketingCategory ?? null,
      payload: buildStoredPayload(input),
      priority: input.priority ?? (input.emailClass === 'transactional' ? 20 : 60),
      ...(input.availableAt ? { available_at: input.availableAt } : {}),
    }, { onConflict: 'idempotency_key', ignoreDuplicates: true })
    .select('id');

  if (error) throw new Error(`email_outbox_enqueue_failed:${error.code ?? 'unknown'}`);
  return data && data.length > 0 ? 'queued' : 'already_queued';
}

function validPremiumContent(payload: Json): PremiumContent | null {
  if (!isRecord(payload)) return null;
  const subject = readString(payload.subject);
  const shloka = readString(payload.shloka);
  const meaning = readString(payload.meaning);
  const title = readString(payload.title);
  const body = readString(payload.body);
  const ctaText = readString(payload.ctaText);
  const ctaUrl = readString(payload.ctaUrl);
  if (!subject || shloka === null || meaning === null || !title || !body || !ctaText || !ctaUrl) return null;
  const unsubUrl = readString(payload.unsubUrl) ?? undefined;
  const rawUnsubType = readString(payload.unsubType);
  const unsubType = rawUnsubType === 'newsletter' || rawUnsubType === 'festivals' ? rawUnsubType : undefined;
  return { subject, shloka, meaning, title, body, ctaText, ctaUrl, ...(unsubUrl ? { unsubUrl } : {}), ...(unsubType ? { unsubType } : {}) };
}

function validHtmlContent(payload: Json): HtmlContent | null {
  if (!isRecord(payload)) return null;
  const subject = readString(payload.subject);
  const html = readString(payload.html);
  const from = readString(payload.from) ?? undefined;
  return subject && html ? { subject, html, ...(from ? { from } : {}) } : null;
}

async function updateClaimedRow(
  admin: AdminClient,
  row: EmailOutboxRow,
  workerId: string,
  update: Database['public']['Tables']['email_outbox']['Update'],
): Promise<boolean> {
  const { data, error } = await admin
    .from('email_outbox')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', 'processing')
    .eq('locked_by', workerId)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`email_outbox_update_failed:${error.code ?? 'unknown'}`);
  return Boolean(data);
}

async function shouldSuppressRow(admin: AdminClient, row: EmailOutboxRow): Promise<string | null> {
  if (!row.recipient_email) return 'missing_recipient';
  if (row.email_class === 'marketing') {
    const payload = isRecord(row.payload) ? row.payload : {};
    const unsubscribeUrl = readString(payload.unsubUrl);
    const unsubscribeType = readString(payload.unsubType);
    if (!unsubscribeUrl || unsubscribeType !== row.marketing_category) return 'missing_unsubscribe_link';
  }
  let emailHash: string;
  try {
    emailHash = hashEmailAddress(row.recipient_email);
  } catch {
    return 'suppression_key_not_configured';
  }

  const { data: suppression, error: suppressionError } = await admin
    .from('email_suppressions')
    .select('email_hash')
    .eq('email_hash', emailHash)
    .maybeSingle();
  if (suppressionError) throw new Error(`email_suppression_lookup_failed:${suppressionError.code ?? 'unknown'}`);
  if (suppression) return 'provider_suppressed';

  if (!row.recipient_user_id) {
    return row.email_class === 'marketing' ? 'marketing_user_required' : null;
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('is_deleting, deletion_requested_at, marketing_consent, email_newsletter, email_festivals')
    .eq('id', row.recipient_user_id)
    .maybeSingle();
  if (profileError) throw new Error(`email_recipient_lookup_failed:${profileError.code ?? 'unknown'}`);

  if (!profile) return 'recipient_account_missing';
  if (row.template_key === 'account_deletion') {
    if (!profile.is_deleting) return 'deletion_request_cancelled';
    const expectedRequestAt = isRecord(row.payload) ? readString(row.payload.deletionRequestedAt) : null;
    const actualRequestAt = typeof profile.deletion_requested_at === 'string' ? profile.deletion_requested_at : null;
    if (expectedRequestAt && actualRequestAt && Date.parse(expectedRequestAt) !== Date.parse(actualRequestAt)) {
      return 'deletion_request_superseded';
    }
  } else if (profile.is_deleting) {
    return 'recipient_account_deleting';
  }

  if (row.email_class === 'marketing') {
    if (row.marketing_category === 'festivals') {
      if (profile.email_festivals !== true) return 'festival_email_disabled';
    } else if (row.marketing_category === 'newsletter') {
      if (profile.marketing_consent !== true) return 'marketing_consent_revoked';
      if (profile.email_newsletter !== true) return 'newsletter_email_disabled';
    }
  }

  return null;
}

async function markWaitlistWelcomeSent(admin: AdminClient, row: EmailOutboxRow) {
  const waitlistId = readString(isRecord(row.payload) ? row.payload.waitlistId : undefined);
  if (!waitlistId) return;
  const { error } = await admin.from('waitlist').update({ email_sent: true }).eq('id', waitlistId);
  if (error) throw new Error(`waitlist_email_status_update_failed:${error.code ?? 'unknown'}`);
}

function premiumContentForRow(row: EmailOutboxRow): PremiumContent | null {
  if (row.template_key === 'onboarding_welcome') {
    const name = isRecord(row.payload) ? readString(row.payload.name)?.trim() : null;
    const greeting = name ? `Welcome, ${name}` : 'Welcome to Shoonaya';
    return {
      subject: 'Welcome to Shoonaya — Find your infinite',
      shloka: '',
      meaning: '',
      title: greeting,
      body: 'Your account is ready. Explore sacred time, begin a daily practice such as Japa, and create a private KUL circle whenever you are ready. Shoonaya is here to help you stay connected to the moments and practices you value.',
      ctaText: 'Explore Shoonaya',
      ctaUrl: 'https://www.shoonaya.com',
    };
  }
  if (row.template_key === 'account_deletion') {
    const stored = validPremiumContent(row.payload);
    if (stored) return stored;
    if (!isRecord(row.payload)) return null;
    const kind = readString(row.payload.kind);
    const requestedAt = readString(row.payload.deletionRequestedAt);
    if (kind === 'completed') return null;
    if ((kind !== 'scheduled' && kind !== 'reminder_7d' && kind !== 'reminder_1d') || !requestedAt) return null;
    return { shloka: '', meaning: '', ...buildDeletionNotice(kind, requestedAt) };
  }
  return validPremiumContent(row.payload);
}

async function processClaimedRow(admin: AdminClient, row: EmailOutboxRow, workerId: string): Promise<'sent' | 'suppressed' | 'retried' | 'dead'> {
  const suppressionReason = await shouldSuppressRow(admin, row);
  if (suppressionReason) {
    await updateClaimedRow(admin, row, workerId, {
      status: suppressionReason === 'suppression_key_not_configured' ? 'pending' : 'suppressed',
      available_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      recipient_email: suppressionReason === 'suppression_key_not_configured' ? row.recipient_email : null,
      recipient_user_id: suppressionReason === 'suppression_key_not_configured' ? row.recipient_user_id : null,
      payload: suppressionReason === 'suppression_key_not_configured' ? row.payload : {},
      last_error_code: suppressionReason,
      locked_by: null,
      locked_until: null,
    });
    return suppressionReason === 'suppression_key_not_configured' ? 'retried' : 'suppressed';
  }

  let result;
  if (row.template_key === 'waitlist_welcome') {
    const content = validHtmlContent(row.payload);
    if (!content) result = { success: false as const, error: 'invalid_email_payload', retryable: false };
    else result = await sendShoonayaHtmlEmail({
      to: row.recipient_email!,
      subject: content.subject,
      html: content.html,
      ...(content.from ? { from: content.from } : {}),
      idempotencyKey: row.idempotency_key,
    });
  } else {
    const content = premiumContentForRow(row);
    if (!content) result = { success: false as const, error: 'invalid_email_payload', retryable: false };
    else result = await sendShoonayaEmail({ to: row.recipient_email!, ...content }, { idempotencyKey: row.idempotency_key });
  }

  if (result.success) {
    if (row.template_key === 'waitlist_welcome') await markWaitlistWelcomeSent(admin, row);
    const updated = await updateClaimedRow(admin, row, workerId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      provider_message_id: result.id ?? null,
      recipient_email: null,
      recipient_user_id: null,
      payload: {},
      last_error_code: null,
      locked_by: null,
      locked_until: null,
    });
    return updated ? 'sent' : 'retried';
  }

  const isDead = !result.retryable || row.attempt_count >= row.max_attempts;
  const delayMs = Math.min(60 * 60_000, 60_000 * 2 ** Math.max(0, row.attempt_count - 1));
  await updateClaimedRow(admin, row, workerId, {
    status: isDead ? 'dead' : 'pending',
    available_at: new Date(Date.now() + delayMs).toISOString(),
    recipient_email: isDead ? null : row.recipient_email,
    recipient_user_id: isDead ? null : row.recipient_user_id,
    payload: isDead ? {} : row.payload,
    last_error_code: result.error,
    locked_by: null,
    locked_until: null,
  });
  return isDead ? 'dead' : 'retried';
}

export async function processEmailOutboxBatch(
  admin: AdminClient = createServiceRoleSupabaseClient(),
  workerId: string = randomUUID(),
  limit: number = 20,
): Promise<EmailOutboxRunResult> {
  const { data, error } = await admin.rpc('claim_email_outbox', {
    p_worker_id: workerId,
    p_limit: limit,
    p_lease_seconds: 120,
  });
  if (error) throw new Error(`email_outbox_claim_failed:${error.code ?? 'unknown'}`);
  const rows = (data ?? []) as EmailOutboxRow[];
  const counts = { claimed: rows.length, sent: 0, suppressed: 0, retried: 0, dead: 0, failed: 0 };

  for (let offset = 0; offset < rows.length; offset += 5) {
    const batch = rows.slice(offset, offset + 5);
    const settled = await Promise.allSettled(batch.map((row: EmailOutboxRow) => processClaimedRow(admin, row, workerId)));
    for (const item of settled) {
      if (item.status === 'fulfilled') counts[item.value] += 1;
      else {
        counts.failed += 1;
        console.error('[email-outbox] delivery attempt failed', item.reason instanceof Error ? item.reason.message : 'unknown');
      }
    }
  }

  return counts;
}
