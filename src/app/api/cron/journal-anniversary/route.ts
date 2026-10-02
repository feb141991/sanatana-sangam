import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNextLocalHourUtc, resolveTimeZone } from '@/lib/sacred-time';
import { enqueueNotificationSchedule } from '@/lib/notification-schedule-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


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
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Fetch all profiles with their creation time and timezone
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at, timezone');

    if (profilesError) {
      console.error('[cron/journal-anniversary] Error fetching profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles found', sent: 0 });
    }

    const now = new Date();
    const anniversaryUsers: { id: string; years: number; timezone: string }[] = [];

    // 2. Identify users whose account creation anniversary is today in their timezone
    for (const profile of profiles) {
      if (!profile.created_at) continue;

      const tz = resolveTimeZone(profile.timezone);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });

      let parts;
      try {
        parts = formatter.formatToParts(now);
      } catch (e) {
        // Fallback if timezone is invalid
        parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        }).formatToParts(now);
      }

      const localMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
      const localDay = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
      const localYear = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);

      const created = new Date(profile.created_at);
      const createdMonth = created.getUTCMonth() + 1;
      const createdDay = created.getUTCDate();
      const createdYear = created.getUTCFullYear();

      if (localMonth === createdMonth && localDay === createdDay && localYear > createdYear) {
        const years = localYear - createdYear;
        anniversaryUsers.push({ id: profile.id, years, timezone: tz });
      }
    }

    if (anniversaryUsers.length === 0) {
      return NextResponse.json({ message: 'No anniversaries today', sent: 0 });
    }

    const anniversaryUserIds = anniversaryUsers.map(u => u.id);

    // 3. Verify if they have journal entries
    const { data: journalEntries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('user_id')
      .in('user_id', anniversaryUserIds);

    if (entriesError) {
      console.error('[cron/journal-anniversary] Error checking journal entries:', entriesError);
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const usersWithJournal = new Set(journalEntries?.map(e => e.user_id) || []);
    const eligibleNotifications = anniversaryUsers.filter(u => usersWithJournal.has(u.id));

    if (eligibleNotifications.length === 0) {
      return NextResponse.json({ message: 'Anniversary users found, but none had journal entries', sent: 0 });
    }

    // 4. Queue a local daytime delivery. The dispatcher persists the bell
    // record and sends the push only after quota, spacing, preferences, and
    // quiet-hours checks have passed.
    const scheduleRows = eligibleNotifications.map((target) => {
      const yearWord = target.years === 1 ? 'One year' : `${target.years} years`;
      const bodyText = `${yearWord} of your spiritual journey is recorded in your Shoonaya journal. [View your year in review →]`;
      const { sendAt, localDateIso } = getNextLocalHourUtc(now, target.timezone, 10, 0);
      return {
        user_id: target.id,
        title: '✨ Journal Anniversary',
        body: bodyText,
        send_at: sendAt.toISOString(),
        notification_type: 'journal_anniversary',
        status: 'pending' as const,
        notification_key: `journal-anniversary:${target.id}:${target.years}:${localDateIso}`,
        metadata: {
          type: 'general',
          emoji: '✨',
          action_url: '/sadhana/journal?focus=anniversary',
          years: target.years,
          timezone: target.timezone,
          local_date: localDateIso,
        },
      };
    });
    const { queued, ignored } = await enqueueNotificationSchedule(supabase, scheduleRows);

    return NextResponse.json({
      message: 'Anniversary notifications queued',
      anniversaries_today: anniversaryUsers.length,
      scheduled_candidates: scheduleRows.length,
      enqueued: queued,
      ignored,
    });
  } catch (error: any) {
    console.error('[cron/journal-anniversary] Cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
