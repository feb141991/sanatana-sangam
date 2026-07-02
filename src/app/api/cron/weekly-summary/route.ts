import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { sendShoonayaEmail } from '@/lib/email';
import { buildSpiritualDateRange, localSpiritualDate, resolveTimeZone } from '@/lib/sacred-time';

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ProfileRow = {
  id: string;
  tradition: string | null;
  timezone: string | null;
  onesignal_player_id: string | null;
};

type DailySadhanaRow = {
  user_id: string;
  date: string;
  japa_done: boolean | null;
  nitya_done: boolean | null;
  pathshala_done: boolean | null;
  quiz_done: boolean | null;
  dharmveer_done: boolean | null;
  perfect_day_bonus_given: boolean | null;
};

const TITLE = '🪔 Saptah Saar — Weekly Reflection';

function authFailed(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get('authorization') !== `Bearer ${cronSecret}`;
}

function compareIso(a: string, b: string) {
  return a.localeCompare(b);
}

function getDominantPractice(rows: DailySadhanaRow[]): string {
  const counts = {
    Japa: 0,
    Nitya: 0,
    Pathshala: 0,
    Quiz: 0,
    'Dharm Veer': 0,
  };

  for (const row of rows) {
    if (row.japa_done) counts.Japa += 1;
    if (row.nitya_done) counts.Nitya += 1;
    if (row.pathshala_done) counts.Pathshala += 1;
    if (row.quiz_done) counts.Quiz += 1;
    if (row.dharmveer_done) counts['Dharm Veer'] += 1;
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Japa';
}

function hasAnyPractice(row: DailySadhanaRow): boolean {
  return Boolean(
    row.japa_done ||
    row.nitya_done ||
    row.pathshala_done ||
    row.quiz_done ||
    row.dharmveer_done
  );
}

function buildPrompt(tradition: string, totalDays: number, perfectDays: number, dominantPractice: string) {
  return {
    system: `You are Dharma Mitra, speaking to a Shoonya — a Shoonaya practitioner on the ${tradition} path. Write a 2-sentence Sunday reflection. Reference their week: ${totalDays}/7 active days, ${perfectDays} perfect days, strongest practice: ${dominantPractice}. End with a motivational verse fragment (no more than 8 words). Under 160 chars total.`,
    user: 'Generate the weekly reflection.',
    temperature: 0.8,
    reasoningEffort: 'none' as const,
    maxOutputTokens: 80,
  };
}

export async function GET(request: Request) {
  if (authFailed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, tradition, timezone, onesignal_player_id, email, email_newsletter, unsubscribe_token')
      .not('onesignal_player_id', 'is', null);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const users = (profiles ?? []) as ProfileRow[];
    if (users.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
    }

    const userDateRanges = new Map<string, string[]>();
    let globalStart: string | null = null;
    let globalEnd: string | null = null;

    for (const user of users) {
      const tz = resolveTimeZone(user.timezone);
      const range = buildSpiritualDateRange(tz, 7, 4);
      userDateRanges.set(user.id, range);

      const start = range[0];
      const end = range[range.length - 1] ?? localSpiritualDate(tz, 4);
      if (!globalStart || compareIso(start, globalStart) < 0) globalStart = start;
      if (!globalEnd || compareIso(end, globalEnd) > 0) globalEnd = end;
    }

    const userIds = users.map((user) => user.id);
    const { data: sadhanaRows, error: sadhanaError } = await supabase
      .from('daily_sadhana')
      .select('user_id, date, japa_done, nitya_done, pathshala_done, quiz_done, dharmveer_done, perfect_day_bonus_given')
      .in('user_id', userIds)
      .gte('date', globalStart!)
      .lte('date', globalEnd!);

    if (sadhanaError) {
      return NextResponse.json({ error: sadhanaError.message }, { status: 500 });
    }

    const rowsByUser = new Map<string, DailySadhanaRow[]>();
    for (const row of (sadhanaRows ?? []) as DailySadhanaRow[]) {
      const current = rowsByUser.get(row.user_id) ?? [];
      current.push(row);
      rowsByUser.set(row.user_id, current);
    }

    const activeUsers = users
      .map((user) => {
        const allowedDates = new Set(userDateRanges.get(user.id) ?? []);
        const userRows = (rowsByUser.get(user.id) ?? []).filter((row) => allowedDates.has(row.date));
        const activeRows = userRows.filter(hasAnyPractice);
        if (activeRows.length === 0) return null;

        return {
          user,
          totalDays: activeRows.length,
          perfectDays: activeRows.filter((row) => row.perfect_day_bonus_given).length,
          dominantPractice: getDominantPractice(activeRows),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (activeUsers.length === 0) {
      return NextResponse.json({ processed: users.length, sent: 0, failed: 0 });
    }

    const settled = await Promise.allSettled(
      activeUsers.map(async ({ user, totalDays, perfectDays, dominantPractice }) => {
        try {
          const tradition = user.tradition ?? 'hindu';
          const result = await generateWithProvider(
            buildPrompt(tradition, totalDays, perfectDays, dominantPractice),
            { responseFormat: 'text' }
          );

          const body = result.text.trim();
          if (!body) {
            throw new Error('Empty weekly summary');
          }

          const pushResult = await sendOneSignalPush({
            userIds: [user.id],
            title: TITLE,
            body,
            url: '/home?focus=weekly-summary',
            data: { type: 'weekly_summary' },
          });

          if (pushResult.sent < 1) {
            throw new Error('Push not sent');
          }

          // Send email digest — only to users who opted in and have an email
          if ((user as any).email_newsletter && (user as any).email) {
            const unsubUrl = `${APP_BASE}/api/unsubscribe?token=${(user as any).unsubscribe_token}`;
            await sendShoonayaEmail({
              to: (user as any).email,
              subject: TITLE,
              shloka: '',
              meaning: '',
              title: TITLE,
              body,
              ctaText: 'Open App',
              ctaUrl: `${APP_BASE}/home`,
              unsubUrl,
            });
          }
          return { userId: user.id, sent: true };
        } catch (error) {
          console.error('[weekly-summary] user failed', user.id, error);
          throw error;
        }
      })
    );

    const sent = settled.filter((result) => result.status === 'fulfilled').length;
    const failed = settled.filter((result) => result.status === 'rejected').length;

    return NextResponse.json({
      processed: activeUsers.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error('[weekly-summary] route crashed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Weekly summary failed' },
      { status: 500 }
    );
  }
}
