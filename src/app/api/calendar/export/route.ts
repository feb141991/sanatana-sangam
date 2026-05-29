import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/calendar/export
 *
 * Generates an RFC-5545 .ics file containing:
 *  1. All upcoming festival / observance occurrences for the next 180 days
 *  2. A recurring daily japa reminder at Brahma Muhurta (5:00 AM by default)
 *
 * The user imports this file once into Google Calendar, Apple Calendar or
 * Outlook — all future festivals and reminders then appear automatically.
 *
 * Auth: requires valid Supabase session (user must be logged in).
 * Returns: text/calendar with Content-Disposition: attachment
 */

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function isoDateToICS(iso: string): string {
  // "2026-03-15" → "20260315"
  return iso.replace(/-/g, '');
}

function nowToICS(): string {
  return new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile for tradition + reminder time preference
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition, timezone, japa_reminder_time, japa_reminder_enabled')
    .eq('id', user.id)
    .maybeSingle();

  const tradition   = (profile as any)?.tradition ?? 'hindu';
  const userName    = (profile as any)?.full_name ?? (profile as any)?.username ?? 'Seeker';
  const reminderEnabled = (profile as any)?.japa_reminder_enabled !== false;

  // Fetch upcoming observances (next 180 days)
  const today  = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + 180);
  const futureIso = future.toISOString().slice(0, 10);

  const { data: occurrences } = await supabase
    .from('observance_occurrences')
    .select('id, date, observance_definitions(name, description, traditions)')
    .gte('date', today)
    .lte('date', futureIso)
    .order('date', { ascending: true })
    .limit(200);

  const dtstamp = nowToICS();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shoonaya//Dharmic Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Shoonaya · ${userName}&apos;s Dharmic Calendar`,
    'X-WR-CALDESC:Festivals and practice reminders from Shoonaya',
    'X-WR-TIMEZONE:UTC',
  ];

  // ── Festivals ──────────────────────────────────────────────────────────────
  for (const occ of occurrences ?? []) {
    const def = (occ as any).observance_definitions;
    if (!def) continue;

    // Filter by tradition — show all-tradition or matching entries
    const traditions: string[] = def.traditions ?? [];
    if (traditions.length > 0 && !traditions.includes(tradition) && !traditions.includes('all')) {
      continue;
    }

    const dtstart  = isoDateToICS(occ.date);
    // All-day event: DTEND = next day
    const nextDay  = new Date(occ.date + 'T12:00:00Z');
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const dtend    = nextDay.toISOString().slice(0, 10).replace(/-/g, '');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:festival-${occ.id}@shoonaya.app`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
    lines.push(`DTEND;VALUE=DATE:${dtend}`);
    lines.push(`SUMMARY:${escapeICS(def.name)}`);
    if (def.description) {
      lines.push(`DESCRIPTION:${escapeICS(def.description)}`);
    }
    lines.push('CATEGORIES:DHARMA,FESTIVAL');
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  }

  // ── Daily japa reminder (recurring) ────────────────────────────────────────
  if (reminderEnabled) {
    // Use saved reminder time or default to 5:00 AM
    const reminderTime: string = (profile as any)?.japa_reminder_time ?? '05:00';
    const [rh, rm] = reminderTime.split(':').map(Number);
    const rhPad = String(rh ?? 5).padStart(2, '0');
    const rmPad = String(rm ?? 0).padStart(2, '0');

    const todayFormatted = today.replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:japa-daily-reminder-${user.id}@shoonaya.app`);
    lines.push(`DTSTAMP:${dtstamp}`);
    // Start time in UTC (browser will display in local timezone)
    lines.push(`DTSTART;TZID=Asia/Kolkata:${todayFormatted}T${rhPad}${rmPad}00`);
    lines.push(`DURATION:PT30M`);
    lines.push('RRULE:FREQ=DAILY');
    lines.push('SUMMARY:🪷 Daily Japa — Shoonaya');
    lines.push('DESCRIPTION:Your daily practice window. Open Shoonaya to begin.');
    lines.push('URL:https://shoonaya.app/bhakti/mala');
    lines.push('CATEGORIES:DHARMA,PRACTICE');
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:Time for japa 🪷');
    lines.push('TRIGGER:-PT5M');
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  const icsBody = lines.join('\r\n');
  const filename = `shoonaya-dharmic-calendar.ics`;

  return new Response(icsBody, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
