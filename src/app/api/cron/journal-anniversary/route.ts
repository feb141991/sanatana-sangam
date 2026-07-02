import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { resolveTimeZone } from '@/lib/sacred-time';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authFailed(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false; // Default to allow if not configured locally for testing
  return request.headers.get('authorization') !== `Bearer ${cronSecret}`;
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
    const anniversaryUsers: { id: string; years: number }[] = [];

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
        anniversaryUsers.push({ id: profile.id, years });
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

    // 4. Send push notifications
    let pushCount = 0;
    for (const target of eligibleNotifications) {
      const yearWord = target.years === 1 ? 'One year' : `${target.years} years`;
      const bodyText = `${yearWord} of your spiritual journey is recorded in your Shoonaya journal. [View your year in review →]`;

      const pushResult = await sendOneSignalPush({
        userIds: [target.id],
        title: '✨ Journal Anniversary',
        body: bodyText,
        url: '/sadhana/journal?focus=anniversary',
        data: { type: 'journal_anniversary', years: String(target.years) },
      });

      pushCount += pushResult.sent;

      // Log notification in the database
      const tz = resolveTimeZone(profiles.find(p => p.id === target.id)?.timezone);
      const localDateStr = now.toLocaleDateString('en-CA', { timeZone: tz });
      try {
        const { error: insErr } = await supabase.from('notifications').insert({
          user_id: target.id,
          title: '✨ Journal Anniversary',
          body: bodyText,
          emoji: '✨',
          type: 'general',
          action_url: '/sadhana/journal',
          notification_key: `journal-anniversary:${target.years}:${localDateStr}`,
          local_date: localDateStr,
          sent_timezone: tz
        });
        if (insErr) {
          console.warn('[cron/journal-anniversary] failed to insert notification row:', insErr);
        }
      } catch (err) {
        console.warn('[cron/journal-anniversary] failed to insert notification row:', err);
      }
    }

    return NextResponse.json({
      message: 'Anniversary notifications processed',
      anniversaries_today: anniversaryUsers.length,
      notifications_sent: pushCount
    });
  } catch (error: any) {
    console.error('[cron/journal-anniversary] Cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
