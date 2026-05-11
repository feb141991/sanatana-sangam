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

// ─── Tradition accent colours ──────────────────────────────────────────────────
const TRAD_COLOR: Record<string, string> = {
  hindu:    '#D88A1C',
  sikh:     '#1B5E8B',
  buddhist: '#8B2D3E',
  jain:     '#2A6B4A',
  default:  '#D88A1C',
};

// ─── Tradition header symbol ───────────────────────────────────────────────────
const TRAD_SYMBOL: Record<string, string> = {
  hindu:    '🕉',
  sikh:     '☬',
  buddhist: '☸',
  jain:     '☮',
  default:  '🪔',
};

// ─── Native-script badge label ─────────────────────────────────────────────────
const TRAD_NATIVE_LABEL: Record<string, string> = {
  hindu:    'Sthapaka · स्थापक',
  sikh:     'Sthapaka · ਸਥਾਪਕ',
  buddhist: 'Sthapaka · स्थापक',
  jain:     'Sthapaka · स्थापक',
  default:  'Sthapaka · स्थापक',
};

// ─── Tradition-specific sacred verse ──────────────────────────────────────────
type TradVerse = {
  script:          string; // verse in native script
  transliteration: string;
  translation:     string;
  source:          string;
};

const TRAD_VERSE: Record<string, TradVerse> = {
  sikh: {
    script:          'ਸੁੰਨ ਸਮਾਧਿ ਆਪਿ ਪ੍ਰਭੁ',
    transliteration: 'Sunn samadhi aap Prabh',
    translation:     '"God himself abides in the stillness of the void"',
    source:          'Guru Nanak Dev Ji · Sidh Gosht · Sri Guru Granth Sahib Ji',
  },
  hindu: {
    script:          'एकं सत् विप्राः बहुधा वदन्ति',
    transliteration: 'Ekaṃ sat viprāḥ bahudhā vadanti',
    translation:     '"Truth is one; the wise call it by many names"',
    source:          'Rigveda · 1.164.46',
  },
  buddhist: {
    script:          'रूपं शून्यता शून्यतैव रूपम्',
    transliteration: 'Rūpaṃ śūnyatā śūnyataiva rūpam',
    translation:     '"Form is emptiness, emptiness itself is form"',
    source:          'Prajñāpāramitā Hṛdaya · Heart Sutra',
  },
  jain: {
    script:          'परस्परोपग्रहो जीवानाम्',
    transliteration: 'Parasparopagṛaho jīvānām',
    translation:     '"Souls render service to one another"',
    source:          'Tattvartha Sutra · 5.21 · Umāsvāmi',
  },
};

// ─── Tradition-specific welcome paragraph ─────────────────────────────────────
const TRAD_WELCOME: Record<string, string> = {
  sikh: `In Gurbani, <em>Sunn</em> is not absence — it is the fullness that holds all of creation.
    The silence before the Shabad. The stillness from which Kirtan rises. You have joined a space
    built to honour that stillness — a living sangam where the Sikh seeker finds community,
    scripture, and practice gathered in one place. You helped lay the first stone.`,

  hindu: `The Rigveda knew it before the traditions divided — <em>Ekaṃ sat</em>, one truth,
    many rivers flowing toward it. This sangam is where those rivers meet. Built for the
    Sanatani seeker who holds the full breadth of dharma: from Veda to Vedanta, from puja
    to Japa, from your Kul lineage to the global sangam. You are one of the first to arrive.`,

  buddhist: `The Heart Sutra's great teaching — that form and void are not two — is the ground
    this platform stands on. <em>Śūnyatā</em> is not emptiness as loss; it is openness as possibility.
    This sangam was built in that spirit: a community of practitioners seeing clearly, across
    every path of dharma, together. Your presence here matters.`,

  jain: `Jain dharma's most radical teaching is that every soul is bound to every other by
    the sacred duty of <em>upagṛaha</em> — mutual upliftment. This sangam was built in exactly
    that spirit: a place where every tradition lifts the others, where ahimsa is not just
    a practice but an architecture. You are among the first souls to take that vow here.`,

  default: `You are among the very first to arrive — a space where the ancient streams of
    Hindu, Sikh, Buddhist, and Jain wisdom flow together into one living community.
    You helped lay the first stone.`,
};

// ─── Tradition-specific share copy ────────────────────────────────────────────
const TRAD_SHARE_COPY: Record<string, string> = {
  sikh:     'Share your spot with the Sangat.',
  hindu:    'Share your spot with fellow Sanatani seekers.',
  buddhist: 'Share your spot with fellow practitioners.',
  jain:     'Share your spot — parasparopagṛaho jīvānām.',
  default:  'Help us build the sangam. Share your founding spot with fellow seekers.',
};

const FOUNDING_PERKS = [
  'Permanent Sthapaka badge on your profile — visible to the whole sangam',
  'Your founding number (#1–1000) displayed in your profile and posts',
  'First month of Shoonaya Pro free on launch day',
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
  return `I just became Sthapaka ${numberLabel} of Shoonaya — a home for Hindu, Sikh, Buddhist and Jain dharma. Join the founding members: https://shoonaya.app`;
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
  const t            = tradition ?? 'default';
  const displayName  = name || 'Dear Sadhak';
  const tradLabel    = tradition ? (TRAD_LABEL[tradition] ?? tradition) : '';
  const greeting     = TRAD_GREETING[t] ?? TRAD_GREETING.default;
  const accent       = TRAD_COLOR[t]        ?? TRAD_COLOR.default;
  const symbol       = TRAD_SYMBOL[t]       ?? TRAD_SYMBOL.default;
  const badgeLabel   = TRAD_NATIVE_LABEL[t] ?? TRAD_NATIVE_LABEL.default;
  const verse        = TRAD_VERSE[t]        ?? null;
  const welcomePara  = TRAD_WELCOME[t]      ?? TRAD_WELCOME.default;
  const shareCopy    = TRAD_SHARE_COPY[t]   ?? TRAD_SHARE_COPY.default;

  // Derived rgba values from accent (hardcoded per tradition for email client compat)
  const accentBg  = t === 'sikh'     ? 'rgba(27,94,139,0.12)'
                  : t === 'buddhist' ? 'rgba(139,45,62,0.12)'
                  : t === 'jain'     ? 'rgba(42,107,74,0.12)'
                  :                    'rgba(216,138,28,0.12)';
  const accentBdr = t === 'sikh'     ? 'rgba(27,94,139,0.35)'
                  : t === 'buddhist' ? 'rgba(139,45,62,0.35)'
                  : t === 'jain'     ? 'rgba(42,107,74,0.35)'
                  :                    'rgba(216,138,28,0.35)';

  const shareUrl = encodeURIComponent('https://shoonaya.app');
  const twitterText = encodeURIComponent(
    `I'm Sthapaka #${foundingNumber} of Shoonaya — a home for Hindu, Sikh, Buddhist & Jain dharma. Join the founding 1,000:`
  );
  const waText = encodeURIComponent(
    `I'm Sthapaka #${foundingNumber} of Shoonaya — one home for Hindu, Sikh, Buddhist & Jain wisdom. Launching June 17, 2026. Join the founding members: https://shoonaya.app`
  );

  const verseBlock = verse ? `
  <!-- Sacred Verse -->
  <tr><td style="padding:0 0 32px;">
    <div style="border-left:3px solid ${accent};padding:20px 24px;background:${accentBg};border-radius:0 12px 12px 0;">
      <div style="font-size:22px;line-height:1.6;color:#FAF6EF;margin-bottom:8px;font-family:Georgia,serif;">${verse.script}</div>
      <div style="font-size:13px;color:rgba(250,246,239,0.55);font-style:italic;margin-bottom:6px;">${verse.transliteration}</div>
      <div style="font-size:14px;color:rgba(250,246,239,0.80);line-height:1.6;margin-bottom:8px;">${verse.translation}</div>
      <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${accent};opacity:0.75;">${verse.source}</div>
    </div>
  </td></tr>` : '';

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
    <div style="font-size:32px;margin-bottom:12px;">${symbol}</div>
    <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${accent};opacity:0.80;">SHOONAYA</div>
    ${tradLabel ? `<div style="font-size:11px;letter-spacing:0.12em;color:rgba(250,246,239,0.35);margin-top:4px;">${tradLabel}</div>` : ''}
  </td></tr>

  <!-- Founding Number Badge -->
  <tr><td align="center" style="padding-bottom:32px;">
    <div style="background:${accentBg};border:1px solid ${accentBdr};border-radius:20px;padding:36px 24px;display:inline-block;min-width:260px;">
      <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(250,246,239,0.50);margin-bottom:14px;">Your Founding Number</div>
      <div style="font-size:68px;font-weight:700;color:${accent};line-height:1;font-family:'Georgia',serif;">#${foundingNumber}</div>
      <div style="font-size:13px;color:rgba(250,246,239,0.45);margin-top:10px;letter-spacing:0.12em;">${badgeLabel}</div>
    </div>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding-bottom:28px;text-align:center;">
    <div style="font-size:12px;letter-spacing:0.1em;color:${accent};margin-bottom:8px;opacity:0.85;">${greeting}</div>
    <h1 style="font-size:26px;font-weight:400;color:#FAF6EF;margin:0 0 18px;line-height:1.3;">
      ${t === 'sikh' ? 'ਜੀ ਆਇਆਂ ਨੂੰ' : 'आपका स्वागत है'}, ${displayName}
    </h1>
    <p style="font-size:15px;color:rgba(250,246,239,0.72);line-height:1.80;margin:0;text-align:left;">
      ${welcomePara}
    </p>
  </td></tr>

  ${verseBlock}

  <!-- Divider -->
  <tr><td style="padding:8px 0 32px;"><div style="height:1px;background:${accentBdr};opacity:0.4;"></div></td></tr>

  <!-- Perks -->
  <tr><td style="padding-bottom:32px;">
    <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${accent};opacity:0.80;margin-bottom:20px;">Your Founding Member Boons</div>
    ${FOUNDING_PERKS.map(p => `
    <div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="color:${accent};font-size:14px;margin-right:10px;">${symbol}</span>
      <span style="font-size:14px;color:rgba(250,246,239,0.78);line-height:1.5;">${p}</span>
    </div>`).join('')}
  </td></tr>

  <!-- Share prompt -->
  <tr><td style="padding:24px;text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;margin-bottom:32px;">
    <div style="font-size:14px;color:rgba(250,246,239,0.65);line-height:1.6;margin-bottom:20px;">
      ${shareCopy}
    </div>
    <a href="https://twitter.com/intent/tweet?text=${twitterText}&url=${shareUrl}"
       style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#FAF6EF;text-decoration:none;padding:10px 24px;border-radius:100px;font-size:13px;margin:4px;">
      Share on X / Twitter
    </a>
    <a href="https://wa.me/?text=${waText}"
       style="display:inline-block;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.25);color:#25d366;text-decoration:none;padding:10px 24px;border-radius:100px;font-size:13px;margin:4px;">
      Share on WhatsApp
    </a>
  </td></tr>

  <!-- CTA Button -->
  <tr><td align="center" style="padding:32px 0;">
    <a href="https://shoonaya.app/join"
       style="display:inline-block;background:${accent};color:#fff;font-weight:700;padding:16px 48px;border-radius:100px;text-decoration:none;font-size:15px;letter-spacing:0.02em;">
      Enter Shoonaya on June 17 →
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="border-top:1px solid ${accentBdr};opacity:0.5;padding-top:24px;">
    <div style="font-size:11px;color:rgba(250,246,239,0.28);line-height:1.7;">
      Shoonaya · Launching June 17, 2026<br>
      Questions? Reply to this email or write to <a href="mailto:cyber.prince@outlook.com" style="color:${accent};text-decoration:none;opacity:0.7;">cyber.prince@outlook.com</a><br>
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
        from:    'Shoonaya <noreply@shoonaya.app>',
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
