// Festival Email Cron – sends reminder emails 3 days before festivals
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendShoonayaEmail } from '@/lib/email';

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authFailed(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get('authorization') !== `Bearer ${cronSecret}`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function GET(request: Request) {
  if (authFailed(request)) {
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
  const { data: upcoming, error: festError } = await supabase
    .from('observance_occurrences')
    .select('*, observance_definitions(*)')
    .eq('date', targetDate)
    .limit(3);

  if (festError) {
    return NextResponse.json({ error: festError.message }, { status: 500 });
  }
  if (!upcoming?.length) {
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

  for (const fest of upcoming) {
    const def: any = (fest as any).observance_definitions || {};
    const key = (def.name || '').toLowerCase().replace(/\s+/g, '_');
    const subject = subjects[key] || `${def.name ?? 'Festival'} is in 3 days ✨`;

    const lead = def.description ? `${def.description}\n\n` : '';
    const across = `Across traditions — the theme of ${def.theme || 'light'} resonates across all four paths, reminding us of unity, liberation, and gratitude.\n\n`;
    const bullets = `- Practice 1 related to ${def.name}\n- Practice 2 related to ${def.name}\n- Practice 3 related to ${def.name}\n`;
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
            body: `${lead}${across}${bullets}\n${cta}`,
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
