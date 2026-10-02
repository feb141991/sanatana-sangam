import type { SupabaseClient } from '@supabase/supabase-js';

import { localTimeToUtc, shiftCivilDate } from '@/lib/observance-timing';
import { isValidTimeZone, localSpiritualDate } from '@/lib/sacred-time';

export type MoodCheckinRow = {
  id: string;
  before_mood: string | null;
  clicked_action: string | null;
  session_status: string | null;
  dismissed: boolean | null;
  created_at: string;
};

function isMoodCheckinRow(value: unknown): value is MoodCheckinRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string'
    && (typeof row.before_mood === 'string' || row.before_mood === null)
    && (typeof row.clicked_action === 'string' || row.clicked_action === null)
    && (typeof row.session_status === 'string' || row.session_status === null)
    && (typeof row.dismissed === 'boolean' || row.dismissed === null)
    && typeof row.created_at === 'string';
}

export type MoodCheckinStatus = {
  hasCompletedToday: boolean;
  hasDismissedToday: boolean;
  openSession: {
    id: string;
    before_mood: string | null;
    clicked_action: string | null;
    created_at: string;
  } | null;
  lastCompletedMood: string | null;
  hasLoggedMoodToday: boolean;
  lastMood: string | null;
  spiritualDate: string;
};

export function resolveMoodTimeZone(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized && isValidTimeZone(normalized) ? normalized : 'UTC';
}

export function getMoodCheckinDayWindow(
  timeZoneInput: string | null | undefined,
  now: Date = new Date(),
  dayBoundaryHour = 4
): { spiritualDate: string; start: Date; end: Date; timeZone: string } | null {
  const timeZone = resolveMoodTimeZone(timeZoneInput);
  const spiritualDate = localSpiritualDate(timeZone, dayBoundaryHour, now);
  const nextSpiritualDate = shiftCivilDate(spiritualDate, 1);
  if (!nextSpiritualDate) return null;

  // Keep mood check-ins aligned with MoodPulse's existing 4 a.m. spiritual
  // day boundary, including DST changes in the user's IANA timezone.
  const boundaryTime = `${String(dayBoundaryHour).padStart(2, '0')}:00`;
  const start = localTimeToUtc(spiritualDate, boundaryTime, timeZone);
  const end = localTimeToUtc(nextSpiritualDate, boundaryTime, timeZone);
  if (!start || !end || end.getTime() <= start.getTime()) return null;

  return { spiritualDate, start, end, timeZone };
}

export function summarizeMoodCheckins(
  rows: MoodCheckinRow[],
  spiritualDate: string
): MoodCheckinStatus {
  const completed = rows.find((row) => row.session_status === 'completed');
  const logged = rows.find((row) => row.before_mood);
  const open = rows.find((row) => row.session_status === 'open');

  return {
    hasCompletedToday: Boolean(completed),
    hasDismissedToday: rows.some((row) => row.dismissed === true || row.session_status === 'dismissed'),
    openSession: open
      ? {
          id: open.id,
          before_mood: open.before_mood,
          clicked_action: open.clicked_action,
          created_at: open.created_at,
        }
      : null,
    lastCompletedMood: completed?.before_mood ?? null,
    hasLoggedMoodToday: Boolean(logged),
    lastMood: logged?.before_mood ?? null,
    spiritualDate,
  };
}

export async function readMoodCheckinStatus(
  supabase: SupabaseClient,
  userId: string,
  timeZone: string | null | undefined,
  now: Date = new Date(),
  dayBoundaryHour = 4
): Promise<{ status: MoodCheckinStatus | null; error: unknown | null }> {
  const window = getMoodCheckinDayWindow(timeZone, now, dayBoundaryHour);
  if (!window) return { status: null, error: new Error('Could not resolve mood spiritual-day window') };

  const { data, error } = await supabase
    .from('user_mood_checkins')
    .select('id, before_mood, clicked_action, completed_action, session_status, dismissed, created_at, closed_at')
    .eq('user_id', userId)
    .gte('created_at', window.start.toISOString())
    .lt('created_at', window.end.toISOString())
    .order('created_at', { ascending: false });

  if (error) return { status: null, error };

  const rows: unknown[] = data ?? [];

  return {
    status: summarizeMoodCheckins(rows.filter(isMoodCheckinRow), window.spiritualDate),
    error: null,
  };
}
