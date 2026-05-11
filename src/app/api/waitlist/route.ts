import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── /api/waitlist ─────────────────────────────────────────────────────────────
// GET  — returns { count: number } (waitlist size for the landing page counter)
// POST — saves a pre-registration; returns { success, foundingNumber, alreadyRegistered }
//        Sends a Sthapaka welcome email via Resend (if RESEND_API_KEY is set).
// Body: { email, tradition?, name?, source?, timezone? }
// ──────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ─── GET — live waitlist count ─────────────────────────────────────────────────
export async function GET() {
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return NextResponse.json({ count: count ?? 0 }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ count: 0 }, { headers: CORS_HEADERS });
  }
}

// ─── Tradition display names for emails ───────────────────────────────────────
const TRAD_LABEL: Record<string, string> = {
  hindu:    'Hindu / Sanatani',
  sikh:     'Sikh Dharma',
  buddhist: 'Buddhist',
  jain:     'Jain Dharma',
};

const TRAD_GREETING: Record<string, string> = {
  hindu:    'Jai Shri Ram 🙏',
  sikh:     'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh ☬',
  buddhist: 'Namo Buddhaya ☸',
  jain:     'Jai Jinendra ☮',
  default:  'Namaste 🙏',
};

const FOUNDING_PERKS = [
  'Permanent Sthapaka badge on your profile — visible to the whole sangam',
  'Your founding number (#1–1000) displayed in your profile and posts',
  'First month of Sangam Pro free on launch day',
  '20% lifetime discount on all Pro subscriptions',
  'Early access to every new feature before public release',
  'Access to the Sthapaka-only Mandali channel (OG founders only)',
  'Tradition-coloured avatar ring — marks you as a founding member',
  'Name in the Founding Members scroll on launch day',
];

type WaitlistRow = {
  id: string;
  founding_number: number | null;
  tradition: string | null;
  email_sent?: boolean | null;
};

const VALID_TRADITIONS = new Set(['hindu', 'sikh', 'buddhist', 'jain']);

function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normaliseTradition(value: unknown): string | null {
  const tradition = textOrNull(value)?.toLowerCase() ?? null;
  return tradition && VALID_TRADITIONS.has(tradition) ? tradition : null;
}

function buildShareText(foundingNumber: number): string {
  const numberLabel = foundingNumber > 0 ? `#${foundingNumber}` : 'founding member';
  return `I just became Sthapaka ${numberLabel} of Sanatan Sangam — a home for Hindu, Sikh, Buddhist and Jain dharma. Join the founding members: https://sanatansangam.app`;
}

async function findRegistration(email: string): Promise<WaitlistRow | null> {
  const { data, error } = await supabase
    .from('waitlist')
    .select('id, founding_number, tradition, email_sent')
    .ilike('email', email)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as WaitlistRow | null;
}

async function ensureFoundingNumber(row: WaitlistRow): Promise<number> {
  if (typeof row.founding_number === 'number' && row.founding_number > 0) {
    return row.founding_number;
  }

  const { data: latest } = await supabase
    .from('waitlist')
    .select('founding_number')
    .not('founding_number', 'is', null)
    .order('founding_number', { ascending: false })
    .limit(1);

  const nextNumber = ((latest?.[0]?.founding_number as number | null | undefined) ?? 0) + 1;

  const { data: updated, error } = await supabase
    .from('waitlist')
    .update({ founding_number: nextNumber })
    .eq('id', row.id)
    .is('founding_number', null)
    .select('founding_number')
    .maybeSingle();

  if (!error && typeof updated?.founding_number === 'number') {
    return updated.founding_number;
  }

  const { data: reread } = await supabase
    .from('waitlist')
    .select('founding_number')
    .eq('id', row.id)
    .maybeSingle();

  return (reread?.founding_number as number | null | undefined) ?? nextNumber;
}

async function updateExistingRegistration(
  row: WaitlistRow,
  updates: {
    tradition: string | null;
    name: string | null;
    source: string | null;
    timezone: string | null;
  }
): Promise<void> {
  const patch: Record<string, string> = {};

  if (updates.tradition && updates.tradition !== row.tradition) {
    patch.tradition = updates.tradition;
  }
  if (updates.name) patch.name = updates.name;
  if (updates.source) patch.source = updates.source;
  if (updates.timezone) patch.timezone = updates.timezone;

  if (!Object.keys(patch).length) return;

  const { error } = await supabase
    .from('waitlist')
    .update(patch)
    .eq('id', row.id);

  if (error) throw error;
}

// ─── Welcome email HTML ────────────────────────────────────────────────────────
function buildEmailHtml(opts: {
  name?: string;
  email: string;
  tradition?: string;
  foundingNumber: number;
}): string {
  const { name, tradition, foundingNumber } = opts;
  const displayName   = name || 'Dear Sadhak';
  const tradLabel     = tradition ? (TRAD_LABEL[tradition] ?? tradition) : '';
  const greeting      = TRAD_GREETING[tradition ?? 'default'] ?? TRAD_GREETING.default;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome, Sthapaka #${foundingNumber}</title>
</head>
<body style="margin:0;padding:0;background:#0d0805;font-family:Georgia,serif;color:#FAF6EF;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0805;">
<tr><td align="center" style="padding:48px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Header -->
  <tr><td align="center" style="padding-bottom:32px;">
    <div style="font-size:32px;margin-bottom:12px;">🪔</div>
    <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(216,138,28,0.75);">SANATAN SANGAM</div>
  </td></tr>

  <!-- Founding Number Badge -->
  <tr><td align="center" style="padding-bottom:32px;">
    <div style="background:rgba(216,138,28,0.10);border:1px solid rgba(216,138,28,0.30);border-radius:20px;padding:36px 24px;display:inline-block;min-width:260px;">
      <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(250,246,239,0.50);margin-bottom:14px;">Your Founding Number</div>
      <div style="font-size:68px;font-weight:700;color:#D88A1C;line-height:1;font-family:'Georgia',serif;">#${foundingNumber}</div>
      <div style="font-size:13px;color:rgba(250,246,239,0.45);margin-top:10px;letter-spacing:0.12em;">Sthapaka · स्थापक${tradLabel ? ' · ' + tradLabel : ''}</div>
    </div>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding-bottom:24px;text-align:center;">
    <div style="font-size:12px;letter-spacing:0.1em;color:rgba(216,138,28,0.7);margin-bottom:6px;">${greeting}</div>
    <h1 style="font-size:26px;font-weight:400;color:#FAF6EF;margin:0 0 16px;line-height:1.3;">आपका स्वागत है, ${displayName}</h1>
    <p style="font-size:15px;color:rgba(250,246,239,0.72);line-height:1.75;margin:0;">
      You are among the very first to join Sanatan Sangam — a place where the
      ancient streams of Hindu, Sikh, Buddhist, and Jain wisdom flow together
      into one living community. You helped lay the first stone.
    </p>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:16px 0 32px;"><div style="height:1px;background:rgba(216,138,28,0.18);"></div></td></tr>

  <!-- Perks -->
  <tr><td style="padding-bottom:32px;">
    <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(216,138,28,0.70);margin-bottom:20px;">Your Founding Member Boons</div>
    ${FOUNDING_PERKS.map(p => `
    <div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:flex-start;gap:12px;">
      <span style="color:#D88A1C;font-size:14px;flex-shrink:0;">🪔</span>
      <span style="font-size:14px;color:rgba(250,246,239,0.78);line-height:1.5;">${p}</span>
    </div>`).join('')}
  </td></tr>

  <!-- Share prompt -->
  <tr><td style="padding-bottom:32px;text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:24px;">
    <div style="font-size:14px;color:rgba(250,246,239,0.65);line-height:1.6;margin-bottom:20px;">
      Help us build the sangam. Share your founding spot with fellow seekers.
    </div>
    <a href="https://twitter.com/intent/tweet?text=I%27m+Sthapaka+%23${foundingNumber}+of+Sanatan+Sangam+%E2%80%94+a+home+for+Hindu%2C+Sikh%2C+Buddhist+%26+Jain+dharma.+Launching+June+17%2C+2026.+Join+the+founding+1%2C000%3A&url=https%3A%2F%2Fsanatansangam.app"
       style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#FAF6EF;text-decoration:none;padding:10px 24px;border-radius:100px;font-size:13px;margin:4px;">
      Share on X / Twitter
    </a>
    <a href="https://wa.me/?text=I%27m+Sthapaka+%23${foundingNumber}+of+Sanatan+Sangam+%E2%80%94+Hindu%2C+Sikh%2C+Buddhist+%26+Jain+traditions+in+one+app.+Launching+June+17%2C+2026.+Join+the+founding+1%2C000%3A+https%3A%2F%2Fsanatansangam.app"
       style="display:inline-block;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.25);color:#25d366;text-decoration:none;padding:10px 24px;border-radius:100px;font-size:13px;margin:4px;">
      Share on WhatsApp
    </a>
  </td></tr>

  <!-- CTA Button -->
  <tr><td align="center" style="padding-bottom:32px;">
    <a href="https://sanatansangam.app/join"
       style="display:inline-block;background:#D88A1C;color:#1C0F06;font-weight:700;padding:16px 48px;border-radius:100px;text-decoration:none;font-size:15px;letter-spacing:0.02em;">
      Join the Sangam on June 17 →
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="border-top:1px solid rgba(216,138,28,0.12);padding-top:24px;">
    <div style="font-size:11px;color:rgba(250,246,239,0.28);line-height:1.7;">
      Sanatan Sangam · Launching June 17, 2026<br>
      Questions? Reply to this email or write to <a href="mailto:cyber.prince@outlook.com" style="color:rgba(216,138,28,0.6);text-decoration:none;">cyber.prince@outlook.com</a><br>
      <a href="#" style="color:rgba(250,246,239,0.28);text-decoration:underline;">Unsubscribe from founding member communications</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Send email via Resend (graceful no-op if key not configured) ──────────────
async function sendWelcomeEmail(opts: {
  email: string;
  name?: string;
  tradition?: string;
  foundingNumber: number;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[waitlist] RESEND_API_KEY not set — skipping email to ${opts.email} (#${opts.foundingNumber})`);
    return;
  }
  try {
    const tradGreeting = TRAD_GREETING[opts.tradition ?? 'default'] ?? TRAD_GREETING.default;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Sanatan Sangam <noreply@sanatansangam.app>',
        to:      [opts.email],
        subject: `${tradGreeting} — आपका स्वागत है, Sthapaka #${opts.foundingNumber} 🪔`,
        html:    buildEmailHtml(opts),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[waitlist] Resend error:', err);
    } else {
      console.log(`[waitlist] Welcome email sent to ${opts.email} (#${opts.foundingNumber})`);
    }
  } catch (e) {
    console.error('[waitlist] Email send failed (non-blocking):', e);
  }
}

// ─── POST — register on waitlist ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    const emailLower = email.toLowerCase().trim();
    const tradition = normaliseTradition(body.tradition);
    const name = textOrNull(body.name);
    const source = textOrNull(body.source) ?? 'landing';
    const timezone = textOrNull(body.timezone);

    // ── Check if already registered ─────────────────────────────────────────
    const existing = await findRegistration(emailLower);

    if (existing) {
      await updateExistingRegistration(existing, { tradition, name, source, timezone });
      const foundingNumber = await ensureFoundingNumber(existing);

      return NextResponse.json(
        {
          success: true,
          foundingNumber,
          alreadyRegistered: true,
          message: `This email is already registered as Sthapaka #${foundingNumber}.`,
          shareText: buildShareText(foundingNumber),
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // ── Insert new registration (founding_number auto-assigned via sequence) ─
    const { data: inserted, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email:     emailLower,
        tradition,
        name,
        source,
        timezone,
      })
      .select('id, founding_number, tradition, email_sent')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const duplicate = await findRegistration(emailLower);
        if (duplicate) {
          await updateExistingRegistration(duplicate, { tradition, name, source, timezone });
          const foundingNumber = await ensureFoundingNumber(duplicate);

          return NextResponse.json(
            {
              success: true,
              foundingNumber,
              alreadyRegistered: true,
              message: `This email is already registered as Sthapaka #${foundingNumber}.`,
              shareText: buildShareText(foundingNumber),
            },
            { status: 200, headers: CORS_HEADERS }
          );
        }
      }
      throw insertError;
    }

    const foundingNumber = await ensureFoundingNumber(inserted as WaitlistRow);

    // ── Mark email as sent + send async (don't block the response) ──────────
    void sendWelcomeEmail({ email: emailLower, name: name ?? undefined, tradition: tradition ?? undefined, foundingNumber });

    // Mark email_sent flag (best-effort)
    void supabase
      .from('waitlist')
      .update({ email_sent: true })
      .eq('email', emailLower);

    return NextResponse.json(
      {
        success: true,
        foundingNumber,
        alreadyRegistered: false,
        message: `You are registered as Sthapaka #${foundingNumber}.`,
        shareText: buildShareText(foundingNumber),
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('[waitlist] POST error:', err);
    return NextResponse.json(
      { error: 'Could not save registration. Please try again.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
