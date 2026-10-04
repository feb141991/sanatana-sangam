import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { escapeEmailHtml, sendShoonayaEmail } from './email';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 're_test_key');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('email rendering and delivery contract', () => {
  it('escapes text inserted into HTML', () => {
    expect(escapeEmailHtml(`<script a="b">it's & done</script>`)).toBe(
      '&lt;script a=&quot;b&quot;&gt;it&#39;s &amp; done&lt;/script&gt;',
    );
  });

  it('escapes dynamic email copy and refuses unsafe action links', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await sendShoonayaEmail({
      to: 'devotee@example.com',
      subject: 'Welcome',
      shloka: '<img src=x onerror=alert(1)>',
      meaning: '<b>meaning</b>',
      title: '<script>title()</script>',
      body: '<script>body()</script>',
      ctaText: '<b>Open</b>',
      ctaUrl: 'javascript:alert(1)',
      unsubUrl: 'javascript:alert(2)',
    });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(request.body));
    expect(payload.html).toContain('&lt;script&gt;title()&lt;/script&gt;');
    expect(payload.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(payload.html).not.toContain('<script>');
    expect(payload.html).not.toContain('href="javascript:');
    expect(payload.html).toContain('href="https://www.shoonaya.com/"');
    expect(payload.html).toContain('Find your infinite.');
    expect(payload.html).toContain('A daily spiritual sanctuary for sacred time, practice, and connection.');
  });

  it('returns an explicit failure when the provider is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');

    const result = await sendShoonayaEmail({
      to: 'devotee@example.com',
      subject: 'Welcome',
      shloka: '',
      meaning: '',
      title: 'Welcome',
      body: 'Welcome to Shoonaya.',
      ctaText: 'Open',
      ctaUrl: 'https://www.shoonaya.com',
    });

    expect(result).toEqual({ success: false, error: 'email_provider_not_configured', retryable: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a stable idempotency key and a category-specific one-click unsubscribe', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email_123' }), { status: 200 }));

    const result = await sendShoonayaEmail({
      to: 'devotee@example.com',
      subject: 'Festival reminder',
      shloka: '',
      meaning: '',
      title: 'Upcoming sacred day',
      body: 'A reviewed observance is approaching.',
      ctaText: 'Open Panchang',
      ctaUrl: 'https://www.shoonaya.com/panchang',
      unsubUrl: 'https://www.shoonaya.com/api/unsubscribe?token=secure-token',
      unsubType: 'festivals',
    }, { idempotencyKey: 'festival-reminder:user:occurrence' });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(request.body));
    expect(request.headers).toMatchObject({ 'Idempotency-Key': 'festival-reminder:user:occurrence' });
    expect(payload.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(payload.headers['List-Unsubscribe']).toContain('type=festivals');
    expect(payload.html).toContain('Unsubscribe from festival emails');
    expect(payload.html).not.toContain('Unsubscribe from the digest');
    expect(result).toEqual({ success: true, id: 'email_123' });
  });

  it.each([
    [409, false, 'provider_http_409'],
    [429, true, 'provider_rate_limited'],
    [503, true, 'provider_http_503'],
    [401, false, 'provider_http_401'],
  ])('classifies Resend HTTP %i without exposing provider response content', async (status, retryable, error) => {
    fetchMock.mockResolvedValueOnce(new Response('private-provider-detail', { status }));
    const result = await sendShoonayaEmail({
      to: 'devotee@example.com',
      subject: 'Test',
      shloka: '',
      meaning: '',
      title: 'Test',
      body: 'Test',
      ctaText: 'Open',
      ctaUrl: 'https://www.shoonaya.com',
    });
    expect(result).toMatchObject({ success: false, retryable, error });
    expect(JSON.stringify(result)).not.toContain('private-provider-detail');
  });
});
