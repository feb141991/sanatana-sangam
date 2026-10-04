import { APP } from '@/lib/config';

const SHOONAYA_GOLD = '#C5A059';
const SHOONAYA_IVORY = '#FAF6EF';
const SHOONAYA_TEXT = '#1A140E';

export interface EmailOptions {
  to: string;
  subject: string;
  shloka: string;
  meaning: string;
  title: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  unsubUrl?: string;
  unsubType?: 'newsletter' | 'festivals';
}

export type EmailSendResult =
  | { success: true; id?: string }
  | { success: false; error: string; retryable: boolean; status?: number };

/**
 * Builds the Shoonaya Zenith-themed HTML wrapper for all emails.
 */
export function escapeEmailHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

function safeHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value, APP.BASE_URL);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function buildPremiumHtml({ shloka, meaning, title, body, ctaText, ctaUrl, unsubUrl, unsubType }: EmailOptions) {
  const safeCtaUrl = safeHttpUrl(ctaUrl) ?? new URL('https://www.shoonaya.com');
  const safeUnsubUrl = unsubUrl ? safeHttpUrl(unsubUrl) : null;
  const categoryUnsubUrl = safeUnsubUrl ? new URL(safeUnsubUrl) : null;
  categoryUnsubUrl?.searchParams.set('type', unsubType ?? 'all');
  const unsubscribeLabel = unsubType === 'newsletter'
    ? 'Unsubscribe from the digest'
    : unsubType === 'festivals'
      ? 'Unsubscribe from festival emails'
      : 'Unsubscribe from optional emails';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, sans-serif; background-color: ${SHOONAYA_IVORY}; color: ${SHOONAYA_TEXT}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #EAE2D5; box-shadow: 0 10px 40px rgba(142,94,42,0.08); }
        .header { background: ${SHOONAYA_IVORY}; padding: 40px 20px; text-align: center; border-bottom: 1px solid #EAE2D5; }
        .logo-text { font-family: 'Georgia', serif; font-size: 28px; font-weight: bold; letter-spacing: -1px; color: ${SHOONAYA_TEXT}; }
        .subtitle { font-size: 10px; text-transform: uppercase; letter-spacing: 4px; color: #854F0B; opacity: 0.6; margin-top: 4px; }
        .content { padding: 40px; text-align: center; }
        .shloka { font-family: 'Georgia', serif; font-style: italic; font-size: 18px; color: ${SHOONAYA_TEXT}; margin-bottom: 24px; line-height: 1.6; }
        .meaning { font-size: 13px; color: #854F0B; margin-bottom: 32px; opacity: 0.8; }
        .button { display: inline-block; background: ${SHOONAYA_GOLD}; color: #ffffff !important; padding: 18px 40px; border-radius: 16px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 1px; }
        .footer { padding: 30px; text-align: center; background: #fafafa; border-top: 1px solid #eee; }
        .signs { font-size: 24px; margin-bottom: 12px; letter-spacing: 15px; }
        .legal { font-size: 11px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">Shoonaya</div>
          <div class="subtitle">Find your infinite.</div>
          <div style="font-size:12px;color:#854F0B;margin-top:8px;">A daily spiritual sanctuary for sacred time, practice, and connection.</div>
        </div>
        <div class="content">
          ${shloka ? `<div class="shloka">“${escapeEmailHtml(shloka)}”</div>` : ''}
          ${meaning ? `<div class="meaning">${escapeEmailHtml(meaning)}</div>` : ''}

          <h2 style="font-size: 24px; margin-bottom: 16px;">${escapeEmailHtml(title)}</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 40px;">
            ${escapeEmailHtml(body)}
          </p>
          
          <a href="${escapeEmailHtml(safeCtaUrl.toString())}" class="button">${escapeEmailHtml(ctaText)}</a>
        </div>
        <div class="footer">
          <div class="signs">🕉️ ☬ ☸️ 🤲</div>
          <p class="legal">A daily spiritual sanctuary for sacred time, practice, and connection.<br>© 2026 Shoonaya. All rights reserved.</p>
          ${categoryUnsubUrl ? `<p class="legal"><a href="${escapeEmailHtml(categoryUnsubUrl.toString())}">${unsubscribeLabel}</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends a premium themed email via Resend. An outbox idempotency key is
 * forwarded to Resend so a retry after an ambiguous network response does not
 * create a second message during Resend's 24-hour idempotency window.
 */
async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  idempotencyKey?: string;
  unsubUrl?: string;
  unsubType?: 'newsletter' | 'festivals';
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'email_provider_not_configured', retryable: true };
  }

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey;

    const requestHeaders: Record<string, string> = {};
    if (input.unsubUrl) {
      const oneClickUrl = safeHttpUrl(input.unsubUrl);
      if (oneClickUrl) {
        oneClickUrl.searchParams.set('type', input.unsubType ?? 'all');
        requestHeaders['List-Unsubscribe'] = `<${oneClickUrl.toString()}>`;
        requestHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: input.from ?? process.env.SHOONAYA_EMAIL_FROM ?? 'Shoonaya <noreply@shoonaya.app>',
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(Object.keys(requestHeaders).length > 0 ? { headers: requestHeaders } : {}),
      }),
    });

    if (!response.ok) {
      // Resend returns 409 when the same idempotency key is reused with a
      // different request body. Retrying that unchanged row cannot recover.
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      return {
        success: false,
        error: response.status === 429 ? 'provider_rate_limited' : `provider_http_${response.status}`,
        retryable,
        status: response.status,
      };
    }

    const body: unknown = await response.json().catch(() => null);
    const id = typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string'
      ? body.id
      : undefined;
    return { success: true, ...(id ? { id } : {}) };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    return { success: false, error: isTimeout ? 'provider_timeout' : 'provider_network_error', retryable: true };
  }
}

export async function sendShoonayaEmail(
  options: EmailOptions,
  delivery: { idempotencyKey?: string } = {},
): Promise<EmailSendResult> {
  return sendResendEmail({
    to: options.to,
    subject: options.subject,
    html: buildPremiumHtml(options),
    idempotencyKey: delivery.idempotencyKey,
    unsubUrl: options.unsubUrl,
    unsubType: options.unsubType,
  });
}

/** Internal worker-only transport for HTML generated by a trusted template. */
export async function sendShoonayaHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  idempotencyKey: string;
}): Promise<EmailSendResult> {
  return sendResendEmail(input);
}
