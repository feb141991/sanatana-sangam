import { createHash } from 'node:crypto';
import type { NotificationCandidateInsert } from '@/types/database';
import { isHourInQuietWindow, resolveTimeZone, getLocalDateIso } from './sacred-time';
import { localTimeToUtc, shiftCivilDate } from './observance-timing';
import {
  getKulLocalDate,
  kulTithiRequestKey,
  resolveKulRecurringGregorianDate,
  resolveNextKulTithiDates,
  validateKulCalendarTimezone,
  type KulTithiRequest,
} from './native-kul-tithi';

const DEFAULT_REMINDER_TIME = '09:00';
const LOCAL_TIME_RE = /^(0[8-9]|1\d|2[01]):[0-5]\d$/;

export type FamilyRemembranceProfile = {
  id: string;
  timezone: string | null;
  app_language: string | null;
  wants_family_remembrance_reminders: boolean;
  family_remembrance_time: string | null;
  family_remembrance_opt_in_generation: number;
  notification_quiet_hours_start: number | null;
  notification_quiet_hours_end: number | null;
};

export type FamilyRemembranceMembership = { id: string; user_id: string; kul_id: string };
export type FamilyRemembranceCalendar = {
  id: string;
  remembrance_generation: number;
  calendar_latitude: number | null;
  calendar_longitude: number | null;
  calendar_timezone: string;
  calendar_reference_label: string;
  calendar_month_system: 'amanta' | 'purnimanta';
};
export type FamilyRemembranceEvent = {
  id: string;
  remembrance_generation: number;
  kul_id: string;
  member_id: string;
  event_date: string;
  recurring: boolean;
  date_system: 'gregorian' | 'tithi';
  masa: number | null;
  paksha: 'shukla' | 'krishna' | null;
  tithi: number | null;
  month_system: 'amanta' | 'purnimanta' | null;
  masa_is_adhika: boolean;
  member_remembrance_generation: number;
};

function languageFor(value: string | null): 'en' | 'hi' | 'pa' {
  const language = value?.trim().toLowerCase();
  return language === 'hi' || language === 'pa' ? language : 'en';
}

const COPY = {
  en: {
    title: 'Family remembrance',
    body: 'Today is a day to remember someone dear. Open your KUL family dates.',
  },
  hi: {
    title: 'परिवार स्मरण',
    body: 'आज किसी प्रियजन को याद करने का दिन है। KUL में परिवार की तिथियाँ देखें।',
  },
  pa: {
    title: 'ਪਰਿਵਾਰਕ ਯਾਦ',
    body: 'ਅੱਜ ਕਿਸੇ ਪਿਆਰੇ ਨੂੰ ਯਾਦ ਕਰਨ ਦਾ ਦਿਨ ਹੈ। KUL ਵਿੱਚ ਪਰਿਵਾਰਕ ਤਾਰੀਖਾਂ ਵੇਖੋ।',
  },
} as const;

function eventTithiRequest(event: FamilyRemembranceEvent): KulTithiRequest | null {
  if (
    event.date_system !== 'tithi' || event.masa === null || event.paksha === null ||
    event.tithi === null || event.month_system === null
  ) return null;
  return {
    masa: event.masa,
    paksha: event.paksha,
    tithi: event.tithi,
    monthSystem: event.month_system,
    masaIsAdhika: event.masa_is_adhika,
  };
}

function planLocalReminder(
  occurrenceDate: string,
  profile: FamilyRemembranceProfile,
  now: Date,
): { scheduledFor: Date; localDate: string; expiresAt: Date; timezone: string } | null {
  const timezone = resolveTimeZone(profile.timezone);
  const requestedTime = profile.family_remembrance_time ?? DEFAULT_REMINDER_TIME;
  if (!LOCAL_TIME_RE.test(requestedTime)) return null;

  let [hour, minute] = requestedTime.split(':').map(Number);
  let date = occurrenceDate;
  if (
    profile.notification_quiet_hours_start != null &&
    profile.notification_quiet_hours_end != null &&
    isHourInQuietWindow(hour, profile.notification_quiet_hours_start, profile.notification_quiet_hours_end)
  ) {
    const shiftedHour = (profile.notification_quiet_hours_end + 1) % 24;
    if (shiftedHour <= hour) {
      const nextDate = shiftCivilDate(date, 1);
      if (!nextDate) return null;
      date = nextDate;
    }
    hour = shiftedHour;
  }

  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const scheduledFor = localTimeToUtc(date, time, timezone);
  if (!scheduledFor || scheduledFor.getTime() <= now.getTime()) return null;
  const localDate = getLocalDateIso(scheduledFor, timezone);
  const nextDate = shiftCivilDate(localDate, 1);
  const expiresAt = nextDate ? localTimeToUtc(nextDate, '00:00', timezone) : null;
  if (!expiresAt || expiresAt.getTime() < scheduledFor.getTime()) return null;
  return { scheduledFor, localDate, expiresAt, timezone };
}

/**
 * Builds at most one privacy-safe reminder per user and local date. Each event
 * is resolved against its own KUL reference; tithis use the existing sunrise
 * calculation and are never described as a ritual muhurta.
 */
export function buildFamilyRemembranceCandidates(input: {
  profiles: FamilyRemembranceProfile[];
  memberships: FamilyRemembranceMembership[];
  calendars: FamilyRemembranceCalendar[];
  events: FamilyRemembranceEvent[];
  deceasedMemberIds: Set<string>;
  now: Date;
}): { candidates: NotificationCandidateInsert[]; unresolvedCount: number; skippedScheduleCount: number } {
  const calendarById = new Map(input.calendars.map((calendar) => [calendar.id, calendar]));
  const eventById = new Map(input.events.map((event) => [event.id, event]));
  const eligibleEventsByKul = new Map<string, FamilyRemembranceEvent[]>();
  for (const event of input.events) {
    if (!event.recurring || !input.deceasedMemberIds.has(`${event.kul_id}:${event.member_id}`)) continue;
    const rows = eligibleEventsByKul.get(event.kul_id) ?? [];
    rows.push(event);
    eligibleEventsByKul.set(event.kul_id, rows);
  }

  const occurrenceByEventId = new Map<string, string>();
  let unresolvedCount = 0;
  for (const [kulId, events] of eligibleEventsByKul) {
    const calendar = calendarById.get(kulId);
    if (!calendar || !validateKulCalendarTimezone(calendar.calendar_timezone)) {
      unresolvedCount += events.length;
      continue;
    }
    const timezone = calendar.calendar_timezone;
    const today = getKulLocalDate(input.now, timezone);
    const tithiEvents = events.flatMap((event) => {
      const request = eventTithiRequest(event);
      return request ? [{ event, request }] : [];
    });
    if (tithiEvents.length > 0 &&
        (!Number.isFinite(calendar.calendar_latitude) || !Number.isFinite(calendar.calendar_longitude))) {
      unresolvedCount += tithiEvents.length;
    } else if (tithiEvents.length > 0) {
      try {
        const resolved = resolveNextKulTithiDates(
          tithiEvents.map(({ request }) => request),
          today,
          { lat: calendar.calendar_latitude!, lon: calendar.calendar_longitude!, tz: timezone },
        );
        for (const { event, request } of tithiEvents) {
          const date = resolved.get(kulTithiRequestKey(request))?.civilDate;
          if (date) occurrenceByEventId.set(event.id, date);
          else unresolvedCount += 1;
        }
      } catch {
        // A single invalid location must not suppress other KULs. No candidate
        // is created for this group; the cron reports aggregate failures.
        unresolvedCount += tithiEvents.length;
      }
    }
    for (const event of events) {
      if (event.date_system !== 'gregorian') continue;
      const date = resolveKulRecurringGregorianDate(event.event_date, today, true);
      if (date) occurrenceByEventId.set(event.id, date);
      else unresolvedCount += 1;
    }
  }

  const profileById = new Map(
    input.profiles
      .filter((profile) => profile.wants_family_remembrance_reminders === true)
      .map((profile) => [profile.id, profile]),
  );
  const grouped = new Map<string, {
    profile: FamilyRemembranceProfile;
    date: string;
    scheduledFor: Date;
    expiresAt: Date;
    timezone: string;
    eventIds: string[];
    kulIds: string[];
    memberIds: string[];
    membershipIds: string[];
      familyDates: string[];
    }>();

  let skippedScheduleCount = 0;
  for (const membership of input.memberships) {
    const profile = profileById.get(membership.user_id);
    if (!profile) continue;
    const events = eligibleEventsByKul.get(membership.kul_id) ?? [];
    for (const event of events) {
      const date = occurrenceByEventId.get(event.id);
      if (!date) continue;
      const plan = planLocalReminder(date, profile, input.now);
      if (!plan) {
        skippedScheduleCount += 1;
        continue;
      }
      const key = `${profile.id}:${plan.localDate}`;
      const current = grouped.get(key) ?? {
        profile,
        date: plan.localDate,
        scheduledFor: plan.scheduledFor,
        expiresAt: plan.expiresAt,
        timezone: plan.timezone,
        eventIds: [],
        kulIds: [],
        memberIds: [],
        membershipIds: [],
        familyDates: [],
      };
      current.eventIds.push(event.id);
      current.kulIds.push(membership.kul_id);
      current.memberIds.push(event.member_id);
      current.membershipIds.push(membership.id);
      current.familyDates.push(date);
      grouped.set(key, current);
    }
  }

  const candidates = [...grouped.values()].flatMap(({ profile, date, scheduledFor, expiresAt, timezone, eventIds, kulIds, memberIds, membershipIds, familyDates }) => {
    const uniqueEventIds = [...new Set(eventIds)].sort();
    const uniqueKulIds = [...new Set(kulIds)].sort();
    const uniqueMemberIds = [...new Set(memberIds)].sort();
    const uniqueMembershipIds = [...new Set(membershipIds)].sort();
    const eventDefinitions = uniqueEventIds.map((id) => {
      const event = eventById.get(id);
      return event ? {
        id: event.id,
        reminderGeneration: event.remembrance_generation,
        memberId: event.member_id,
        memberGeneration: event.member_remembrance_generation,
        eventDate: event.event_date,
        dateSystem: event.date_system,
        masa: event.masa,
        paksha: event.paksha,
        tithi: event.tithi,
        monthSystem: event.month_system,
        masaIsAdhika: event.masa_is_adhika,
        recurring: event.recurring,
      } : null;
    });
    const calendarDefinitions = uniqueKulIds.map((id) => {
      const calendar = calendarById.get(id);
      return calendar ? {
        id,
        latitude: calendar.calendar_latitude,
        longitude: calendar.calendar_longitude,
        timezone: calendar.calendar_timezone,
        monthSystem: calendar.calendar_month_system,
        generation: calendar.remembrance_generation,
      } : null;
    });
    const membershipByKul = new Map(
      input.memberships
        .filter((membership) => membership.user_id === profile.id)
        .map((membership) => [membership.kul_id, membership]),
    );
    const eventSources = uniqueEventIds.flatMap((id) => {
      const event = eventById.get(id);
      const membership = event ? membershipByKul.get(event.kul_id) : null;
      const calendar = event ? calendarById.get(event.kul_id) : null;
      const occurrenceDate = occurrenceByEventId.get(id);
      if (!event || !membership || !calendar || !occurrenceDate) return [];
      return [{
          event_id: event.id,
          event_generation: event.remembrance_generation,
        event_type: 'death_anniversary',
        kul_id: event.kul_id,
        member_id: event.member_id,
        membership_id: membership.id,
        member_generation: event.member_remembrance_generation,
        event_date: event.event_date,
        date_system: event.date_system,
        masa: event.masa,
        paksha: event.paksha,
        tithi: event.tithi,
        month_system: event.month_system,
        masa_is_adhika: event.masa_is_adhika,
        recurring: event.recurring,
        occurrence_date: occurrenceDate,
        calendar: {
          latitude: calendar.calendar_latitude,
          longitude: calendar.calendar_longitude,
          timezone: calendar.calendar_timezone,
          month_system: calendar.calendar_month_system,
          generation: calendar.remembrance_generation,
        },
      }];
    });
    if (eventSources.length === 0) return [];
    const fingerprint = createHash('sha256').update(JSON.stringify({
      eventIds: uniqueEventIds,
      eventDefinitions,
      eventSources,
      kulIds: uniqueKulIds,
      calendarDefinitions,
      memberIds: uniqueMemberIds,
      membershipIds: uniqueMembershipIds,
      generation: profile.family_remembrance_opt_in_generation,
      time: profile.family_remembrance_time ?? DEFAULT_REMINDER_TIME,
      timezone: profile.timezone,
      language: profile.app_language,
      quietHoursStart: profile.notification_quiet_hours_start,
      quietHoursEnd: profile.notification_quiet_hours_end,
    })).digest('hex').slice(0, 24);
    const language = languageFor(profile.app_language);
    const copy = COPY[language];
    return [{
      user_id: profile.id,
      event_type: 'family_remembrance',
      event_id: 'kul-family-remembrance',
      event_instance: fingerprint,
      local_date: date,
      audience_variant: 'general',
      scheduled_for: scheduledFor.toISOString(),
      expires_at: expiresAt.toISOString(),
      priority: 30,
      title: copy.title,
      body: copy.body,
      action_url: '/kul?section=family',
      language,
      timezone,
      tradition: null,
      calendar_profile: null,
      source_status: 'user_provided',
      source_refs: {},
      metadata: {
        action_url: '/kul?section=family',
        profile_generation: profile.family_remembrance_opt_in_generation,
        reminder_time: profile.family_remembrance_time ?? DEFAULT_REMINDER_TIME,
        quiet_hours_start: profile.notification_quiet_hours_start,
        quiet_hours_end: profile.notification_quiet_hours_end,
        event_sources: eventSources,
        event_ids: uniqueEventIds,
        kul_ids: uniqueKulIds,
        member_ids: uniqueMemberIds,
        membership_ids: uniqueMembershipIds,
        family_calendar_dates: [...new Set(familyDates)].sort(),
        local_date: date,
        timezone,
        reminder_kind: 'annual_family_remembrance',
        copy_is_private: true,
      },
    }];
  });
  return { candidates, unresolvedCount, skippedScheduleCount };
}
