// Festival Email Cron – sends reminder emails 3 days before festivals
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendShoonayaEmail } from '@/lib/email';
import { filterWithheldJoinedRows } from '@/lib/calendar/withheld';
import { CANONICAL_RULES } from '@/lib/calendar/rules';

// filterWithheldJoinedRows is rule-based: for a slug with ZERO rules.json
// rows it returns `false` (not withheld) -- confirmed at withheld.ts:87,
// `if (rulesForSlug.length === 0) return false`. It was never built to
// gate content that has no rule to check against at all, so it provides NO
// protection for the 7 manual-seed slugs (das-lakshana-dharma,
// gudi-padwa-ugadi, paryushana-parva, pavarana, samvatsari, sangha-day,
// vassa-begins -- see docs/RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md)
// that this route would otherwise still email about. A prior fix here
// claimed to close exposure for these too and did not -- corrected now:
// fail closed and never email about a slug with no rules.json entry until
// a reviewer has actually approved it there.
const RULED_SLUGS = new Set(CANONICAL_RULES.map(r => r.slug));

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.shoonaya.com';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ----- Target date (3 days from now) -----
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const targetDate = threeDaysFromNow.toISOString().slice(0, 10);

  // ----- Fetch festivals on target date -----
  // publication_status = 'published' is required at the query level: without
  // it, a 'draft'/'withheld_disputed' row (e.g. paryushana-parva-begins'
  // 2027 row, which is exactly withheld_disputed today) whose SLUG still has
  // a currently-publishable rule would pass filterWithheldJoinedRows below --
  // that function checks the RULE (launch_status/disputed_years), never the
  // individual row's own publication_status, outside one narrow bypass path
  // (fixtureScopedApproval) this route's rows never qualify for.
  const { data: upcoming, error: festError } = await supabase
    .from('observance_occurrences')
    .select('*, observance_definitions(*)')
    .eq('date', targetDate)
    .eq('publication_status', 'published')
    .limit(3);

  if (festError) {
    return NextResponse.json({ error: festError.message }, { status: 500 });
  }

  // Two-stage gate. Every other calendar-facing read path (home-summary,
  // calendar/month, /upcoming, /day, /export) applies filterWithheldJoinedRows
  // or formatOccurrencesToResults internally; this route previously applied
  // neither. An unfiltered read here is worse than an unfiltered screen: this
  // route PUSHES content via email, which can't be un-sent once delivered.
  // See docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md §10 for the incident.
  //
  // Stage 1 (rule-based): withholds a currently-disputed/deferred RULE.
  // Stage 2 (existence-based): filterWithheldJoinedRows returns `false` (not
  // withheld) for a slug with zero rules.json rows at all -- it has nothing
  // to check. That leaves the 7 manual-seed slugs completely unprotected by
  // stage 1 alone, so stage 2 fails closed on them explicitly, rather than
  // only ever emailing about content a reviewer has actually approved via a
  // real rule.
  const ruleFiltered = filterWithheldJoinedRows(upcoming ?? []);
  const publishable = ruleFiltered.filter((row) => {
    const def = (row as any).observance_definitions;
    const slug = Array.isArray(def) ? def[0]?.slug : def?.slug;
    return typeof slug === 'string' && RULED_SLUGS.has(slug);
  });
  if (!publishable.length) {
    return NextResponse.json({ message: 'No festivals in 3 days', sent: 0 });
  }

  // ----- Users opted‑in for festival emails -----
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, full_name, tradition, unsubscribe_token')
    .eq('email_festivals', true)
    .not('email', 'is', null)
    .not('email', 'like', '%@whatsapp.shoonaya.app');

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const userBatches = chunk(users ?? [], 50);
  let totalSent = 0;
  let totalFailed = 0;

  const subjects: Record<string, string> = {
    diwali: 'Diwali is in 3 days 🪔 — the festival of inner light',
    guru_nanak: "Gurpurab in 3 days ☬ — the Guru's light shines for all",
    buddha_purnima: 'Buddha Purnima in 3 days ☸️ — the moon of awakening',
    mahavir_jayanti: 'Mahavir Jayanti in 3 days 🤲 — the path of Ahimsa',
  };

  for (const fest of publishable) {
    const rawDef = (fest as any).observance_definitions;
    // observance_definitions has display_name, not name or theme -- neither
    // of the latter has ever existed as a column. Reading them always
    // resolved to undefined, so `key` was always '', the subjects lookup
    // always missed, and every email's subject silently fell back to the
    // generic "Festival is in 3 days" regardless of which festival it was.
    const def: any = (Array.isArray(rawDef) ? rawDef[0] : rawDef) || {};
    const name: string = def.display_name ?? 'Festival';
    const key = name.toLowerCase().replace(/\s+/g, '_');
    const subject = subjects[key] || `${name} is in 3 days ✨`;

    const lead = def.description ? `${def.description}\n\n` : '';
    const bullets = `- Practice 1 related to ${name}\n- Practice 2 related to ${name}\n- Practice 3 related to ${name}\n`;
    const cta = `Set your reminder in Shoonaya → ${APP_BASE}/panchang`;

    for (const batch of userBatches) {
      const results = await Promise.allSettled(
        batch.map(async user => {
          const unsub = `${APP_BASE}/api/unsubscribe?token=${user.unsubscribe_token}`;
          await sendShoonayaEmail({
            to: user.email!,
            subject,
            shloka: '',
            meaning: '',
            title: subject,
            body: `${lead}${bullets}\n${cta}`,
            ctaText: 'Explore',
            ctaUrl: `${APP_BASE}/panchang`,
            unsubUrl: unsub,
          });
        })
      );
      totalSent += results.filter(r => r.status === 'fulfilled').length;
      totalFailed += results.filter(r => r.status === 'rejected').length;
      await new Promise(r => setTimeout(r, 200)); // rate‑limit buffer
    }
  }

  return NextResponse.json({ sent: totalSent, failed: totalFailed });
}
