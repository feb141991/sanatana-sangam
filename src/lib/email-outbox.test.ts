import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminMock, sendPremium, sendHtml } = vi.hoisted(() => ({
  adminMock: { rpc: vi.fn(), from: vi.fn() },
  sendPremium: vi.fn(),
  sendHtml: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({ createServiceRoleSupabaseClient: () => adminMock }));
vi.mock('@/lib/email', () => ({
  sendShoonayaEmail: (...args: unknown[]) => sendPremium(...args),
  sendShoonayaHtmlEmail: (...args: unknown[]) => sendHtml(...args),
}));

import { hashEmailAddress, processEmailOutboxBatch } from './email-outbox';

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'outbox-1',
    idempotency_key: 'test-key-1',
    recipient_email: 'person@example.com',
    recipient_user_id: 'user-1',
    template_key: 'kul_invite',
    email_class: 'transactional',
    marketing_category: null,
    payload: {
      subject: 'Family invitation',
      shloka: '',
      meaning: '',
      title: 'Join your family',
      body: 'You have an invitation.',
      ctaText: 'View invite',
      ctaUrl: 'https://www.shoonaya.com/kul',
    },
    status: 'processing',
    priority: 30,
    attempt_count: 1,
    max_attempts: 8,
    available_at: new Date().toISOString(),
    locked_until: new Date(Date.now() + 120_000).toISOString(),
    locked_by: 'worker-1',
    provider_message_id: null,
    last_error_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sent_at: null,
    ...overrides,
  };
}

function configureAdmin(row: ReturnType<typeof makeRow>, profile: Record<string, unknown> | null = { is_deleting: false }) {
  const updates: Record<string, unknown>[] = [];
  adminMock.rpc.mockResolvedValue({ data: [row], error: null });
  adminMock.from.mockImplementation((table: string) => {
    if (table === 'email_suppressions') {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    }
    if (table === 'profiles') {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) };
    }
    if (table === 'email_outbox') {
      return {
        update: (patch: Record<string, unknown>) => {
          updates.push(patch);
          const builder: Record<string, (...args: unknown[]) => unknown> = {};
          builder.eq = () => builder;
          builder.select = () => builder;
          builder.maybeSingle = async () => ({ data: { id: row.id }, error: null });
          return builder;
        },
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
  return updates;
}

beforeEach(() => {
  vi.stubEnv('EMAIL_SUPPRESSION_HMAC_KEY', 'stable-test-key');
  adminMock.rpc.mockReset();
  adminMock.from.mockReset();
  sendPremium.mockReset();
  sendHtml.mockReset();
  sendPremium.mockResolvedValue({ success: true, id: 'resend-id' });
  sendHtml.mockResolvedValue({ success: true, id: 'resend-id' });
});

describe('email outbox delivery', () => {
  it('normalizes addresses before hashing and requires a configured HMAC key', () => {
    expect(hashEmailAddress(' Person@Example.com ', 'key')).toBe(hashEmailAddress('person@example.com', 'key'));
    expect(() => hashEmailAddress('person@example.com', '')).toThrow('email_suppression_key_not_configured');
  });

  it('sends once with the stable provider key and scrubs recipient content after acceptance', async () => {
    const row = makeRow();
    const updates = configureAdmin(row);
    const result = await processEmailOutboxBatch(adminMock as never, 'worker-1', 20);

    expect(result).toMatchObject({ claimed: 1, sent: 1, suppressed: 0, retried: 0, dead: 0 });
    expect(sendPremium).toHaveBeenCalledWith(expect.objectContaining({ to: 'person@example.com' }), {
      idempotencyKey: 'test-key-1',
    });
    expect(updates.at(-1)).toMatchObject({
      status: 'sent',
      recipient_email: null,
      recipient_user_id: null,
      payload: {},
      provider_message_id: 'resend-id',
    });
  });

  it('re-checks consent immediately before delivery and suppresses revoked marketing permission', async () => {
    const row = makeRow({
      email_class: 'marketing',
      marketing_category: 'newsletter',
      payload: {
        ...makeRow().payload,
        unsubUrl: 'https://www.shoonaya.com/api/unsubscribe?token=opaque',
        unsubType: 'newsletter',
      },
    });
    const updates = configureAdmin(row, {
      is_deleting: false,
      marketing_consent: false,
      email_newsletter: true,
      email_festivals: true,
    });
    const result = await processEmailOutboxBatch(adminMock as never, 'worker-1', 20);

    expect(result).toMatchObject({ claimed: 1, sent: 0, suppressed: 1 });
    expect(sendPremium).not.toHaveBeenCalled();
    expect(updates.at(-1)).toMatchObject({
      status: 'suppressed',
      last_error_code: 'marketing_consent_revoked',
      recipient_email: null,
      payload: {},
    });
  });

  it('fails closed when a marketing row has no category-matched unsubscribe link', async () => {
    const row = makeRow({ email_class: 'marketing', marketing_category: 'festivals' });
    const updates = configureAdmin(row);
    const result = await processEmailOutboxBatch(adminMock as never, 'worker-1', 20);

    expect(result).toMatchObject({ claimed: 1, sent: 0, suppressed: 1 });
    expect(sendPremium).not.toHaveBeenCalled();
    expect(updates.at(-1)).toMatchObject({ status: 'suppressed', last_error_code: 'missing_unsubscribe_link' });
  });

  it('requeues retryable provider failures while retaining the same recipient and key', async () => {
    const row = makeRow();
    const updates = configureAdmin(row);
    sendPremium.mockResolvedValueOnce({ success: false, error: 'provider_timeout', retryable: true });
    const result = await processEmailOutboxBatch(adminMock as never, 'worker-1', 20);

    expect(result).toMatchObject({ claimed: 1, sent: 0, retried: 1 });
    expect(sendPremium.mock.calls[0][1]).toEqual({ idempotencyKey: 'test-key-1' });
    expect(updates.at(-1)).toMatchObject({
      status: 'pending',
      last_error_code: 'provider_timeout',
      recipient_email: 'person@example.com',
      payload: row.payload,
    });
  });

  it('suppresses a queued account-deletion message if that exact request was cancelled', async () => {
    const row = makeRow({
      template_key: 'account_deletion',
      payload: { kind: 'scheduled', deletionRequestedAt: '2026-10-01T10:00:00.000Z' },
    });
    const updates = configureAdmin(row, { is_deleting: false, deletion_requested_at: null });
    const result = await processEmailOutboxBatch(adminMock as never, 'worker-1', 20);

    expect(result).toMatchObject({ claimed: 1, sent: 0, suppressed: 1 });
    expect(sendPremium).not.toHaveBeenCalled();
    expect(updates.at(-1)).toMatchObject({ status: 'suppressed', last_error_code: 'deletion_request_cancelled' });
  });

  it('delivers the account-deletion completion receipt without looking up the deleted profile', async () => {
    const row = makeRow({
      template_key: 'account_deletion',
      recipient_user_id: null,
      payload: {
        subject: 'Your Shoonaya account has been deleted',
        shloka: '',
        meaning: '',
        title: 'Account deletion complete',
        body: 'Your Shoonaya account and associated personal profile data have been deleted.',
        ctaText: 'Visit Shoonaya',
        ctaUrl: 'https://www.shoonaya.com',
      },
    });
    const updates = configureAdmin(row, null);
    const result = await processEmailOutboxBatch(adminMock as never, 'worker-1', 20);

    expect(result).toMatchObject({ claimed: 1, sent: 1, suppressed: 0, retried: 0, dead: 0 });
    expect(sendPremium).toHaveBeenCalledWith(expect.objectContaining({
      to: 'person@example.com',
      subject: 'Your Shoonaya account has been deleted',
      title: 'Account deletion complete',
    }), { idempotencyKey: 'test-key-1' });
    expect(adminMock.from).not.toHaveBeenCalledWith('profiles');
    expect(updates.at(-1)).toMatchObject({ status: 'sent', recipient_email: null, recipient_user_id: null, payload: {} });
  });

  it('reports unexpected row-processing failures in the worker summary', async () => {
    adminMock.rpc.mockResolvedValue({ data: [makeRow()], error: null });
    adminMock.from.mockImplementation(() => { throw new Error('simulated lookup failure'); });
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await processEmailOutboxBatch(adminMock as never, 'worker-1', 20);

    expect(result).toMatchObject({ claimed: 1, failed: 1 });
    log.mockRestore();
  });
});
