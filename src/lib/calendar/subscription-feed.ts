import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestProfile } from './request-profile';
import { shiftDate, PROFILE_RESOLUTION_PAD_DAYS } from './request-profile';
import { localSpiritualDate } from '@/lib/sacred-time';
import { CALENDAR_OCCURRENCE_SELECT, attachMaterialisationBatches } from './occurrence-reader';
import { formatOccurrencesToResults, type ClientObservanceResult } from './observance-formatter';
import { buildObservanceSeries } from './observance-series';

export type CalendarSubscriptionSettings = Pick<RequestProfile, 'calendarProfile' | 'tradition' | 'sampradaya' | 'timezone' | 'context'>;

export function subscriptionSettings(profile: CalendarSubscriptionSettings): CalendarSubscriptionSettings {
  const c = profile.context;
  const location = c.effectiveCalculationLocation;
  if (!profile.timezone || c.calendarProfile === 'unknown' || !c.disclosureDiagnostics.calendarProfileKnown
      || !c.disclosureDiagnostics.locationKnown || !c.disclosureDiagnostics.traditionKnown
      || location.latitude == null || location.longitude == null || !location.timezone
      || c.locationSource !== 'user_explicit' || c.disclosureDiagnostics.resolutionStatus !== 'resolved') {
    throw new Error('CALENDAR_PROFILE_REQUIRED');
  }
  new Intl.DateTimeFormat('en', { timeZone: profile.timezone }).format();
  return { calendarProfile: profile.calendarProfile, tradition: profile.tradition,
    sampradaya: profile.sampradaya, timezone: profile.timezone, context: c };
}

export async function loadSubscriptionEvents(supabase: SupabaseClient, settings: CalendarSubscriptionSettings) {
  subscriptionSettings(settings);
  const from = localSpiritualDate(settings.timezone!, 4);
  const to = shiftDate(from, 180);
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('observance_occurrences')
      .select(CALENDAR_OCCURRENCE_SELECT)
      .gte('date', shiftDate(from, -PROFILE_RESOLUTION_PAD_DAYS))
      .lte('date', shiftDate(to, PROFILE_RESOLUTION_PAD_DAYS))
      .in('calendar_profile', [settings.calendarProfile, 'legacy-ujjain'])
      .eq('observance_definitions.active', true)
      .in('observance_definitions.tradition', [settings.tradition, 'all'])
      .order('id').range(offset, offset + 499);
    if (error) throw new Error('CALENDAR_UNAVAILABLE');
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
    if (offset >= 9500) throw new Error('CALENDAR_UNAVAILABLE');
  }
  // Keep unverified siblings through canonical resolution; filtering them out
  // before resolution can incorrectly promote an alternative to primary.
  const enriched = await attachMaterialisationBatches(rows, undefined, settings.calendarProfile, settings.context.effectiveCalculationLocation);
  const formatted = formatOccurrencesToResults(enriched, [], settings.tradition, settings.calendarProfile,
    settings.sampradaya, from, to, settings.context);
  const eligibleIds = new Set(rows.filter(row => row.review_status === 'reviewed'
    && row.verification_status === 'verified' && row.audit_status === 'completed'
    && row.publication_status === 'published').map(row => row.id));
  const incompleteIds = new Set<string>();
  for (const tradition of new Set(formatted.map(event => event.profile.tradition))) {
    const group = formatted.filter(event => event.profile.tradition === tradition);
    const first = group[0];
    if (!first) continue;
    const series = buildObservanceSeries(group, { spiritualDate: from, profile: first.profile, location: first.location, tradition });
    for (const item of series.filter(item => item.status === 'under_review')) {
      for (const child of item.children) if (child.occurrenceId) incompleteIds.add(child.occurrenceId);
    }
  }
  const location = settings.context.effectiveCalculationLocation;
  const events = formatted.filter(event => event.id && eligibleIds.has(event.id) && !incompleteIds.has(event.id)
    && event.isPrimary && event.status === 'resolved' && event.civilDate && event.confidence === 'high'
    && event.profile.calendar === settings.calendarProfile
    && event.location.tz === location.timezone
    && event.location.lat.toFixed(6) === location.latitude!.toFixed(6)
    && event.location.lon.toFixed(6) === location.longitude!.toFixed(6));
  return { from, to, events };
}

export function escapeCalendarText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

/** RFC 5545's limit is octets, so never split a Unicode code point. */
export function foldCalendarLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  for (const character of line) {
    if (Buffer.byteLength(current + character, 'utf8') > 75) { parts.push(current); current = ' '; }
    current += character;
  }
  parts.push(current);
  return parts.join('\r\n');
}

export function renderSubscriptionCalendar(events: ClientObservanceResult[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Shoonaya//Sacred Calendar//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Shoonaya Sacred Calendar', 'REFRESH-INTERVAL;VALUE=DURATION:PT12H'];
  for (const event of events) {
    if (!event.id || !event.civilDate) continue;
    lines.push('BEGIN:VEVENT', `UID:festival-${escapeCalendarText(event.id)}@shoonaya.app`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${event.civilDate.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${shiftDate(event.civilDate, 1).replace(/-/g, '')}`,
      `SUMMARY:${escapeCalendarText(event.display_name)}`,
      `DESCRIPTION:${escapeCalendarText(event.description)}`, 'STATUS:CONFIRMED', 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  return lines.concat('END:VCALENDAR').map(foldCalendarLine).join('\r\n') + '\r\n';
}
