// Festival Email Cron – sends reminder emails 3 days before festivals
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendShoonayaEmail } from '@/lib/email';
import { filterEligibleMarketingObservances } from '@/lib/marketing/sources/published-observance';
import { resolveRecipientEmails } from '@/lib/server/recipient-emails';

// filterEligibleMarketingObservances applies the same three-stage safety gate the
// admin marketing pipeline uses (publication_status='published', then
// filterWithheldJoinedRows for currently-disputed/deferred rules, then the
// RULED_SLUGS allowlist so a slug with zero rules.json rows -- the 7 manual-seed
// slugs: das-lakshana-dharma, gudi-padwa-ugadi, paryushana-parva, pavarana,
// samvatsari, sangha-day, vassa-begins -- fails closed instead of passing by
// default). Previously duplicated inline here; now one shared implementation so the
// two call sites can't drift. See docs/RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md
// and docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md §10 for why this matters: this
// route PUSHES content via email, which can't be un-sent once delivered.

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
  // No .limit() here -- it must apply AFTER policy filtering, not before.
  // Capping the raw query at 3 let up to 3 withheld/unruled rows crowd out
  // a 4th, genuinely publishable one for the same date, and with no ORDER
  // BY which 3 of an unbounded set came back was nondeterministic run to
  // run. Ordered by `id` purely for a stable, reproducible result -- there
  // is no meaningful ordering across festivals sharing one date.
  // publication_status='published' is also re-applied inside
  // filterEligibleMarketingObservances, but kept here too so this raw query never
  // returns a withheld_disputed row to begin with.
  const { data: upcoming, error: festError } = await supabase
    .from('observance_occurrences')
    .select('*, observance_definitions(*)')
    .eq('date', targetDate)
    .eq('publication_status', 'published')
    .order('id');

  if (festError) {
    return NextResponse.json({ error: festError.message }, { status: 500 });
  }

  const eligible = filterEligibleMarketingObservances(upcoming ?? []);
  // The 3-item cap is a delivery-volume choice (don't send an email listing
  // ten unrelated festivals), not a policy gate -- it belongs after
  // filtering, not on the raw query, so a withheld/unruled row can never
  // count against it.
  const publishable = eligible.slice(0, 3);
  if (!publishable.length) {
    return NextResponse.json({ message: 'No festivals in 3 days', sent: 0 });
  }

  // ----- Users opted-in for festival emails -----
  // profiles carries no email column (see src/lib/server/recipient-emails.ts) --
  // resolve eligible profile IDs first, then look up email via auth.users
  // separately, in that order, so the RPC is only ever called with IDs already
  // filtered to this specific eligible set.
  const { data: candidateProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, tradition, unsubscribe_token')
    .eq('email_festivals', true);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  interface CandidateProfile {
    id: string;
    full_name: string | null;
    tradition: string | null;
    unsubscribe_token: string | null;
  }
  interface EmailableProfile extends CandidateProfile {
    email: string;
  }

  const profiles = (candidateProfiles ?? []) as CandidateProfile[];
  const emailByUserId = await resolveRecipientEmails(supabase, profiles.map(p => p.id));

  const users: EmailableProfile[] = profiles
    .map(p => ({ ...p, email: emailByUserId[p.id] ?? '' }))
    .filter((u): u is EmailableProfile => Boolean(u.email) && !u.email.endsWith('@whatsapp.shoonaya.app'));

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
