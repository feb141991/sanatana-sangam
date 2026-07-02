import { TRADITION_SIGNS } from '@/lib/utils'; // Assuming this exists or we define locally

const SHOONAYA_GOLD = '#C5A059';
const SHOONAYA_IVORY = '#FAF6EF';
const SHOONAYA_TEXT = '#1A140E';

interface EmailOptions {
  to: string;
  subject: string;
  shloka: string;
  meaning: string;
  title: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
}

/**
 * Builds the Shoonaya Zenith-themed HTML wrapper for all emails.
 */
function buildPremiumHtml({ shloka, meaning, title, body, ctaText, ctaUrl }: Omit<EmailOptions, 'to' | 'subject'>) {
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
          <div class="subtitle">Find Your Infinity</div>
        </div>
        <div class="content">
          <div class="shloka">“${shloka}”</div>
          <div class="meaning">${meaning}</div>
          
          <h2 style="font-size: 24px; margin-bottom: 16px;">${title}</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 40px;">
            ${body}
          </p>
          
          <a href="${ctaUrl}" class="button">${ctaText}</a>
        </div>
        <div class="footer">
          <div class="signs">🕉️ ☬ ☸️ 🤲</div>
          <p class="legal">Join the Shoonaya Mandali.<br>© 2026 Shoonaya. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends a premium themed email via Resend.
 */
export async function sendShoonayaEmail(options: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Shoonaya Email] No RESEND_API_KEY found. Skipping email.');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Shoonaya <noreply@shoonaya.app>',
        to: [options.to],
        subject: options.subject,
        html: buildPremiumHtml(options),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Shoonaya Email] Failed to send:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('[Shoonaya Email] Fetch error:', err);
    return { success: false, error: err };
  }
}
