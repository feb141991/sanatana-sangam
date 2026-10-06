import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { checkDurableRateLimit, clientIp, rejectLargeRequest } from '@/lib/api-security';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { escapeEmailHtml } from '@/lib/email';
import { boundedText, isValidIanaTimezone, normalizeWaitlistEmail } from '@/lib/early-access-policy';

// ─── /api/waitlist ─────────────────────────────────────────────────────────────
// GET  — returns { count: number } (waitlist size for the landing page counter)
// POST — atomically records a waitlist request and queues its confirmation email.
// Body: { email, tradition?, name?, source?, timezone? }
// ──────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

// Lazily initialized so route imports remain safe during builds without env vars.
let _sb: ReturnType<typeof createServiceRoleSupabaseClient> | undefined;
function db() {
  return (_sb ??= createServiceRoleSupabaseClient());
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.shoonaya.com';
const DOMAIN = BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_BODY_BYTES = 8 * 1024;
const IP_RATE_LIMIT = { limit: 10, windowMs: 60 * 60_000 };
const EMAIL_RATE_LIMIT = { limit: 3, windowMs: 24 * 60 * 60_000 };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ─── GET — live waitlist count ─────────────────────────────────────────────────
export async function GET() {
  try {
    const { count, error } = await db()
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
  hindu:    'Shoonaya · शून्य',
  sikh:     'Shoonaya · ਸ਼ੂਨ੍ਯ',
  buddhist: 'Shoonaya · शून्य',
  jain:     'Shoonaya · शून्य',
  default:  'Shoonaya · शून्य',
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
  sikh: `Thank you for your interest in Shoonaya. Selected Sikh teachings and experiences are presented
    in their own context where available. This confirms your request; it does not create an account or
    invitation, or guarantee an access date.`,

  hindu: `Thank you for your interest in Shoonaya. Explore local sacred-time context, daily practice,
    scripture, and selected learning tools as they become available. This confirms your request; it does
    not create an account or invitation, or guarantee an access date.`,

  buddhist: `Thank you for your interest in Shoonaya. Selected Buddhist teachings and reflective practices
    are presented in their own context where available. This confirms your request; it does not create an
    account or invitation, or guarantee an access date.`,

  jain: `Thank you for your interest in Shoonaya. Selected Jain teachings, observances, and practice
    references are presented in their own context where available. This confirms your request; it does
    not create an account or invitation, or guarantee an access date.`,

  default: `Thank you for your interest in Shoonaya: Find your infinite. This confirms your interest request
    only; it does not create an account or invitation, or guarantee an access date.`,
};

const WHAT_TO_EXPECT = [
  'Your request is recorded on the Shoonaya early-access list',
  'It does not create an account, whitelist, or invitation',
  'No access date or availability is guaranteed',
];

function buildShareText(): string {
  return `I joined Shoonaya's early-access list. Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection: ${BASE_URL}`;
}


// ─── Welcome email HTML ────────────────────────────────────────────────────────
function buildEmailHtml(opts: {
  name?: string;
  tradition?: string;
}): string {
  const { name, tradition } = opts;
  const t            = tradition ?? 'default';
  const displayName  = escapeEmailHtml(name || 'there');
  const tradLabel    = tradition ? escapeEmailHtml(TRAD_LABEL[tradition] ?? tradition) : '';
  const greeting     = TRAD_GREETING[t] ?? TRAD_GREETING.default;
  const accent       = TRAD_COLOR[t]        ?? TRAD_COLOR.default;
  const symbol       = TRAD_SYMBOL[t]       ?? TRAD_SYMBOL.default;
  const badgeLabel   = TRAD_NATIVE_LABEL[t] ?? TRAD_NATIVE_LABEL.default;
  const verse        = TRAD_VERSE[t]        ?? null;
  const welcomePara  = TRAD_WELCOME[t]      ?? TRAD_WELCOME.default;

  // Derived rgba values from accent (hardcoded per tradition for email client compat)
  const accentBg  = t === 'sikh'     ? 'rgba(27,94,139,0.12)'
                  : t === 'buddhist' ? 'rgba(139,45,62,0.12)'
                  : t === 'jain'     ? 'rgba(42,107,74,0.12)'
                  :                    'rgba(216,138,28,0.12)';
  const accentBdr = t === 'sikh'     ? 'rgba(27,94,139,0.35)'
                  : t === 'buddhist' ? 'rgba(139,45,62,0.35)'
                  : t === 'jain'     ? 'rgba(42,107,74,0.35)'
                  :                    'rgba(216,138,28,0.35)';

  const shareUrl = encodeURIComponent(BASE_URL);
  const twitterText = encodeURIComponent(
    `I joined Shoonaya's early-access list. Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection:`
  );
  const waText = encodeURIComponent(
    `I joined Shoonaya's early-access list. Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection. Explore Shoonaya: ${BASE_URL}`
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
<title>Your Shoonaya early-access request</title>
</head>
<body style="margin:0;padding:0;background:#0d0805;font-family:Georgia,serif;color:#FAF6EF;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0805;">
<tr><td align="center" style="padding:48px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Header -->
  <tr><td align="center" style="padding-bottom:32px;">
    <div style="font-size:32px;margin-bottom:12px;">${symbol}</div>
    <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${accent};opacity:0.80;">SHOONAYA</div>
    <div style="font-size:13px;color:rgba(250,246,239,0.78);margin-top:8px;">Find your infinite.</div>
    <div style="font-size:11px;color:rgba(250,246,239,0.52);margin-top:4px;">A daily spiritual sanctuary for sacred time, practice, and connection.</div>
    ${tradLabel ? `<div style="font-size:11px;letter-spacing:0.12em;color:rgba(250,246,239,0.35);margin-top:4px;">${tradLabel}</div>` : ''}
  </td></tr>

  <!-- Welcome Badge -->
  <tr><td align="center" style="padding-bottom:32px;">
    <div style="background:${accentBg};border:1px solid ${accentBdr};border-radius:20px;padding:36px 24px;display:inline-block;min-width:260px;">
      <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(250,246,239,0.50);margin-bottom:14px;">Early Access</div>
      <div style="font-size:42px;font-weight:700;color:${accent};line-height:1;font-family:'Georgia',serif;">शून्य</div>
      <div style="font-size:13px;color:rgba(250,246,239,0.45);margin-top:10px;letter-spacing:0.12em;">${badgeLabel}</div>
    </div>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding-bottom:28px;text-align:center;">
    <div style="font-size:12px;letter-spacing:0.1em;color:${accent};margin-bottom:8px;opacity:0.85;">${greeting}</div>
    <h1 style="font-size:26px;font-weight:400;color:#FAF6EF;margin:0 0 18px;line-height:1.3;">
      ${t === 'sikh' ? 'ਜੀ ਆਇਆਂ ਨੂੰ' : 'नमस्ते'}, ${displayName}
    </h1>
    <p style="font-size:15px;color:rgba(250,246,239,0.72);line-height:1.80;margin:0;text-align:left;">
      ${welcomePara}
    </p>
  </td></tr>

  ${verseBlock}

  <!-- Divider -->
  <tr><td style="padding:8px 0 32px;"><div style="height:1px;background:${accentBdr};opacity:0.4;"></div></td></tr>

  <!-- What to expect -->
  <tr><td style="padding-bottom:32px;">
    <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${accent};opacity:0.80;margin-bottom:20px;">What to expect</div>
    ${WHAT_TO_EXPECT.map(p => `
    <div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="color:${accent};font-size:14px;margin-right:10px;">${symbol}</span>
      <span style="font-size:14px;color:rgba(250,246,239,0.78);line-height:1.5;">${p}</span>
    </div>`).join('')}
  </td></tr>

  <!-- Share prompt -->
  <tr><td style="padding:24px;text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;margin-bottom:32px;">
    <div style="font-size:14px;color:rgba(250,246,239,0.65);line-height:1.6;margin-bottom:20px;">
      Share Shoonaya with someone who may value a little more connection to sacred time and daily practice.
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
    <a href="${BASE_URL}"
       style="display:inline-block;background:${accent};color:#fff;font-weight:700;padding:16px 48px;border-radius:100px;text-decoration:none;font-size:15px;letter-spacing:0.02em;">
      Explore Shoonaya →
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="border-top:1px solid ${accentBdr};opacity:0.5;padding-top:24px;">
    <div style="font-size:11px;color:rgba(250,246,239,0.28);line-height:1.7;">
      Shoonaya · Early-access request received<br>
      Questions? Reply to this email or write to <a href="mailto:info@shoonaya.com" style="color:${accent};text-decoration:none;opacity:0.7;">info@shoonaya.com</a><br>
      This is a one-time confirmation for your early-access request. It does not create an account or promise a release date.
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildWelcomeEmailPayload(opts: {
  name?: string;
  tradition?: string;
}): { subject: string; html: string; from: string } {
  const tradGreeting = TRAD_GREETING[opts.tradition ?? 'default'] ?? TRAD_GREETING.default;
  return {
    subject: `${tradGreeting}: your Shoonaya early-access request`,
    html: buildEmailHtml(opts),
    from: process.env.SHOONAYA_EMAIL_FROM ?? `Shoonaya <noreply@${DOMAIN.replace(/^www\./, '')}>`,
  };
}

// ─── POST — register on waitlist ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const sizeRejection = rejectLargeRequest(req, MAX_BODY_BYTES);
    if (sizeRejection) return sizeRejection;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'Early access is temporarily unavailable.' }, { status: 503, headers: CORS_HEADERS });
    }

    const supabase = db();
    const ipDigest = createHmac('sha256', serviceKey).update(`early-access-ip:${clientIp(req)}`).digest('hex');
    const ipRateRejection = await checkDurableRateLimit(
      `early-access-ip:${ipDigest}`,
      IP_RATE_LIMIT.limit,
      IP_RATE_LIMIT.windowMs,
      supabase,
    );
    if (ipRateRejection) return ipRateRejection;

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413, headers: CORS_HEADERS });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: CORS_HEADERS });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: CORS_HEADERS });
    }
    const input = body as Record<string, unknown>;
    const email = normalizeWaitlistEmail(input.email);
    if (!email) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400, headers: CORS_HEADERS });
    }

    const emailDigest = createHmac('sha256', serviceKey).update(`early-access-email:${email}`).digest('hex');
    const emailRateRejection = await checkDurableRateLimit(
      `early-access-email:${emailDigest}`,
      EMAIL_RATE_LIMIT.limit,
      EMAIL_RATE_LIMIT.windowMs,
      supabase,
    );
    if (emailRateRejection) return emailRateRejection;

    // A filled honeypot receives the same acknowledgement as a real request,
    // while avoiding database writes and email delivery.
    if (boundedText(input.company_website, 200)) {
      return NextResponse.json({ success: true, message: 'Your request has been received.' }, { status: 200, headers: CORS_HEADERS });
    }

    const traditionValue = boundedText(input.tradition, 20)?.toLowerCase() ?? null;
    if (traditionValue && !['hindu', 'sikh', 'buddhist', 'jain', 'universal'].includes(traditionValue)) {
      return NextResponse.json({ error: 'Please choose a listed tradition.' }, { status: 400, headers: CORS_HEADERS });
    }
    const tradition = traditionValue === 'universal' ? null : traditionValue;
    const name = boundedText(input.name, 80);
    if (input.name !== undefined && input.name !== null && String(input.name).trim() && !name) {
      return NextResponse.json({ error: 'Name must be 80 characters or fewer.' }, { status: 400, headers: CORS_HEADERS });
    }
    const source = boundedText(input.source, 120) ?? 'landing';
    const timezoneValue = boundedText(input.timezone, 80);
    if (timezoneValue && !isValidIanaTimezone(timezoneValue)) {
      return NextResponse.json({ error: 'Please provide a valid timezone.' }, { status: 400, headers: CORS_HEADERS });
    }
    const timezone = timezoneValue;

    const url = new URL(req.url);
    const queryRef = boundedText(url.searchParams.get('ref'), 10);
    const querySource = boundedText(url.searchParams.get('utm_source') ?? url.searchParams.get('source'), 120);
    const refRaw = boundedText(input.ref, 10) ?? queryRef;
    const referredByNumber = refRaw && /^\d{1,10}$/.test(refRaw) ? Number(refRaw) : null;
    const referralSource = boundedText(input.referral_source, 120)
      ?? boundedText(input.utm_source, 120)
      ?? querySource
      ?? (refRaw ? 'direct' : null);

    const emailPayload = buildWelcomeEmailPayload({
      name: name ?? undefined,
      tradition: tradition ?? undefined,
    });
    const { data, error } = await supabase.rpc('register_waitlist_with_welcome', {
      p_email: email,
      p_tradition: tradition,
      p_name: name,
      p_source: source,
      p_timezone: timezone,
      p_referred_by_number: referredByNumber,
      p_referral_source: referralSource,
      p_email_payload: emailPayload,
    });
    let result: { founding_number?: number | null; email?: string } | null = null;

    if (error) {
      if (error.code === 'PGRST202') {
        // Fallback for environments where migration 20261005160000 has not been applied yet.
        // Performs direct table operations so early-access signups are never blocked.
        console.warn('[waitlist] RPC register_waitlist_with_welcome missing (PGRST202); using direct table fallback');
        const { data: existing } = await supabase
          .from('waitlist')
          .select('*')
          .ilike('email', email)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        let row: any = existing;
        if (existing) {
          const { data: updated } = await supabase
            .from('waitlist')
            .update({
              tradition: tradition ?? existing.tradition,
              name: name ?? existing.name,
              source: source ?? existing.source,
              timezone: timezone ?? existing.timezone,
              referred_by_number: referredByNumber ?? existing.referred_by_number,
              referral_source: referralSource ?? existing.referral_source,
            })
            .eq('id', existing.id)
            .select()
            .single();
          row = updated ?? existing;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('waitlist')
            .insert({
              email,
              tradition,
              name,
              source,
              timezone,
              referred_by_number: referredByNumber,
              referral_source: referralSource,
            })
            .select()
            .single();
          if (insertError) {
            console.error('[waitlist] direct fallback insert failed', insertError);
            throw insertError;
          }
          row = inserted;
        }

        if (row && row.email_sent !== true) {
          try {
            await supabase.from('email_outbox').insert({
              idempotency_key: `waitlist-welcome:${row.id}`,
              recipient_email: email,
              template_key: 'waitlist_welcome',
              email_class: 'transactional',
              payload: { ...emailPayload, waitlistId: row.id },
              priority: 40,
            });
          } catch (outboxErr) {
            console.warn('[waitlist] outbox fallback enqueue warning:', outboxErr);
          }
        }

        result = row;
      } else {
        console.error('[waitlist] registration transaction failed', { code: error.code ?? 'unknown' });
        return NextResponse.json(
          { error: 'Could not save your request. Please try again shortly.' },
          { status: 503, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } },
        );
      }
    } else {
      result = data && typeof data === 'object' && !Array.isArray(data) ? (data as { founding_number?: number | null; email?: string }) : null;
    }
    if (!result || typeof result.email !== 'string') {
      console.error('[waitlist] registration transaction returned invalid data');
      return NextResponse.json(
        { error: 'Could not confirm your request. Please try again shortly.' },
        { status: 503, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      {
        success: true,
        foundingNumber: typeof result.founding_number === 'number' ? result.founding_number : null,
        message: 'Your early-access interest request has been recorded.',
        shareText: buildShareText(),
      },
      { status: 200, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('[waitlist] POST failed', { error: err instanceof Error ? err.name : 'unknown' });
    return NextResponse.json(
      { error: 'Could not save your request. Please try again shortly.' },
      { status: 503, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } },
    );
  }
}
