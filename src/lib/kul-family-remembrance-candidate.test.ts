import { describe, expect, it } from 'vitest';
import { computeAstronomy, getLunarMonth, getSunriseForDateStr } from '@sangam/panchang-engine';
import {
  buildFamilyRemembranceCandidates,
  type FamilyRemembranceCalendar,
  type FamilyRemembranceEvent,
  type FamilyRemembranceMembership,
  type FamilyRemembranceProfile,
} from './kul-family-remembrance-candidate';

const USER_ID = 'user-1';
const KUL_ID = 'kul-1';
const MEMBER_ID = 'family-member-1';

function profile(overrides: Partial<FamilyRemembranceProfile> = {}): FamilyRemembranceProfile {
  return {
    id: USER_ID,
    timezone: 'Asia/Kolkata',
    app_language: 'en',
    wants_family_remembrance_reminders: true,
    family_remembrance_time: '09:00',
    family_remembrance_opt_in_generation: 1,
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 7,
    ...overrides,
  };
}

function membership(overrides: Partial<FamilyRemembranceMembership> = {}): FamilyRemembranceMembership {
  return { id: 'membership-1', user_id: USER_ID, kul_id: KUL_ID, ...overrides };
}

function calendar(overrides: Partial<FamilyRemembranceCalendar> = {}): FamilyRemembranceCalendar {
  return {
    id: KUL_ID,
    remembrance_generation: 1,
    calendar_latitude: 23.1765,
    calendar_longitude: 75.7885,
    calendar_timezone: 'Asia/Kolkata',
    calendar_reference_label: 'Family calendar',
    calendar_month_system: 'amanta',
    ...overrides,
  };
}

function gregorianEvent(overrides: Partial<FamilyRemembranceEvent> = {}): FamilyRemembranceEvent {
  return {
    id: 'event-1',
    remembrance_generation: 1,
    kul_id: KUL_ID,
    member_id: MEMBER_ID,
    event_date: '2000-10-20',
    recurring: true,
    date_system: 'gregorian',
    masa: null,
    paksha: null,
    tithi: null,
    month_system: null,
    masa_is_adhika: false,
    member_remembrance_generation: 2,
    ...overrides,
  };
}

const deceased = (kulId = KUL_ID, memberId = MEMBER_ID) => new Set([`${kulId}:${memberId}`]);

describe('KUL family remembrance candidate producer', () => {
  it('requires explicit opt-in and a deceased person in the same KUL', () => {
    const base = {
      profiles: [profile({ wants_family_remembrance_reminders: false })],
      memberships: [membership()],
      calendars: [calendar()],
      events: [gregorianEvent()],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    };
    expect(buildFamilyRemembranceCandidates(base).candidates).toHaveLength(0);
    expect(buildFamilyRemembranceCandidates({
      ...base,
      profiles: [profile()],
      deceasedMemberIds: deceased('another-kul'),
    }).candidates).toHaveLength(0);
  });

  it('resolves a recurring Gregorian anniversary once in the recipient timezone', () => {
    const result = buildFamilyRemembranceCandidates({
      profiles: [profile({ family_remembrance_time: '09:15' })],
      memberships: [membership()],
      calendars: [calendar()],
      events: [gregorianEvent()],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(1);
    const candidate = result.candidates[0]!;
    const metadata = candidate.metadata as Record<string, unknown>;
    expect(candidate).toMatchObject({
      event_type: 'family_remembrance',
      local_date: '2026-10-20',
      scheduled_for: '2026-10-20T03:45:00.000Z',
      timezone: 'Asia/Kolkata',
      action_url: '/kul?section=family',
    });
    expect(candidate.title).toBe('Family remembrance');
    expect(candidate.body).not.toContain(MEMBER_ID);
    expect(metadata).toMatchObject({
      profile_generation: 1,
      event_ids: ['event-1'],
      kul_ids: [KUL_ID],
      member_ids: [MEMBER_ID],
      local_date: '2026-10-20',
      reminder_kind: 'annual_family_remembrance',
    });
    expect(metadata.event_sources).toEqual([
      expect.objectContaining({
        event_id: 'event-1',
        event_type: 'death_anniversary',
        kul_id: KUL_ID,
        member_id: MEMBER_ID,
        membership_id: 'membership-1',
        occurrence_date: '2026-10-20',
      }),
    ]);
  });

  it('coalesces multiple KUL dates on the same recipient day and never exposes names', () => {
    const otherKul = 'kul-2';
    const otherMember = 'family-member-2';
    const result = buildFamilyRemembranceCandidates({
      profiles: [profile()],
      memberships: [membership(), membership({ id: 'membership-2', kul_id: otherKul })],
      calendars: [calendar(), calendar({ id: otherKul, calendar_timezone: 'Europe/London' })],
      events: [
        gregorianEvent(),
        gregorianEvent({ id: 'event-2', kul_id: otherKul, member_id: otherMember }),
      ],
      deceasedMemberIds: new Set([`${KUL_ID}:${MEMBER_ID}`, `${otherKul}:${otherMember}`]),
      now: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(1);
    const metadata = result.candidates[0]!.metadata as Record<string, unknown>;
    expect(metadata.event_ids).toEqual(['event-1', 'event-2']);
    expect(metadata.kul_ids).toEqual([KUL_ID, otherKul]);
    expect(result.candidates[0].body).not.toContain('family-member');
  });

  it('changes the semantic idempotency key when a member or consent generation changes', () => {
    const input = {
      profiles: [profile()],
      memberships: [membership()],
      calendars: [calendar()],
      events: [gregorianEvent()],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    };
    const first = buildFamilyRemembranceCandidates(input).candidates[0];
    const changedConsent = buildFamilyRemembranceCandidates({
      ...input,
      profiles: [profile({ family_remembrance_opt_in_generation: 2 })],
    }).candidates[0];
    const changedMember = buildFamilyRemembranceCandidates({
      ...input,
      events: [gregorianEvent({ member_remembrance_generation: 3 })],
    }).candidates[0];
    const changedQuietHours = buildFamilyRemembranceCandidates({
      ...input,
      profiles: [profile({ notification_quiet_hours_start: 21 })],
    }).candidates[0];
    const changedEvent = buildFamilyRemembranceCandidates({
      ...input,
      events: [gregorianEvent({ remembrance_generation: 2 })],
    }).candidates[0];
    const changedCalendar = buildFamilyRemembranceCandidates({
      ...input,
      calendars: [calendar({ remembrance_generation: 2 })],
    }).candidates[0];
    expect(changedConsent.event_instance).not.toBe(first.event_instance);
    expect(changedMember.event_instance).not.toBe(first.event_instance);
    expect(changedQuietHours.event_instance).not.toBe(first.event_instance);
    expect(changedEvent.event_instance).not.toBe(first.event_instance);
    expect(changedCalendar.event_instance).not.toBe(first.event_instance);
  });

  it('rejects a configured time outside the safe daytime window', () => {
    const result = buildFamilyRemembranceCandidates({
      profiles: [profile({ family_remembrance_time: '07:30' })],
      memberships: [membership()],
      calendars: [calendar()],
      events: [gregorianEvent()],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(0);
    expect(result.skippedScheduleCount).toBe(1);
  });

  it('skips an anniversary after its local reminder time instead of sending it late', () => {
    const result = buildFamilyRemembranceCandidates({
      profiles: [profile()],
      memberships: [membership()],
      calendars: [calendar()],
      events: [gregorianEvent({ event_date: '2000-10-03' })],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T05:00:00.000Z'), // 10:30 in Asia/Kolkata.
    });
    expect(result.candidates).toHaveLength(0);
    expect(result.skippedScheduleCount).toBe(1);
  });

  it('moves a requested time out of quiet hours and handles a DST transition', () => {
    const quietHours = buildFamilyRemembranceCandidates({
      profiles: [profile({
        notification_quiet_hours_start: 8,
        notification_quiet_hours_end: 10,
      })],
      memberships: [membership()],
      calendars: [calendar()],
      events: [gregorianEvent()],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(quietHours.candidates[0].scheduled_for).toBe('2026-10-20T05:30:00.000Z'); // 11:00 IST.

    const dst = buildFamilyRemembranceCandidates({
      profiles: [profile({ timezone: 'Europe/London', family_remembrance_time: '09:00' })],
      memberships: [membership()],
      calendars: [calendar({ calendar_timezone: 'Europe/London' })],
      events: [gregorianEvent({ event_date: '2000-03-29' })],
      deceasedMemberIds: deceased(),
      now: new Date('2026-03-20T00:00:00.000Z'),
    });
    expect(dst.candidates[0].scheduled_for).toBe('2026-03-29T08:00:00.000Z');
  });

  it('uses the family KUL sunrise engine for a tithi remembrance date', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const date = '2026-10-03';
    const { sunrise } = getSunriseForDateStr(date, location);
    const month = getLunarMonth(sunrise, 'amanta');
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    const tithiIndex = Math.floor(computeAstronomy(sunrise).elongation / 12) + 1;
    const result = buildFamilyRemembranceCandidates({
      profiles: [profile()],
      memberships: [membership()],
      calendars: [calendar()],
      events: [gregorianEvent({
        date_system: 'tithi',
        masa: month.monthIndex + 1,
        paksha: tithiIndex <= 15 ? 'shukla' : 'krishna',
        tithi: ((tithiIndex - 1) % 15) + 1,
        month_system: 'amanta',
        masa_is_adhika: month.isAdhika,
      })],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(1);
    const metadata = result.candidates[0]!.metadata as Record<string, unknown>;
    expect(metadata.family_calendar_dates).toContain(date);
  });

  it('fails closed when the KUL location cannot calculate a tithi', () => {
    const result = buildFamilyRemembranceCandidates({
      profiles: [profile()],
      memberships: [membership()],
      calendars: [calendar({ calendar_latitude: null, calendar_longitude: null })],
      events: [gregorianEvent({ date_system: 'tithi', masa: 1, paksha: 'krishna', tithi: 15, month_system: 'amanta' })],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(0);
    expect(result.unresolvedCount).toBe(1);
  });

  it('still resolves Gregorian family dates when location coordinates are unavailable', () => {
    const result = buildFamilyRemembranceCandidates({
      profiles: [profile()],
      memberships: [membership()],
      calendars: [calendar({ calendar_latitude: null, calendar_longitude: null })],
      events: [gregorianEvent()],
      deceasedMemberIds: deceased(),
      now: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.local_date).toBe('2026-10-20');
    expect(result.unresolvedCount).toBe(0);
  });
});
