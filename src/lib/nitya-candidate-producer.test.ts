import { describe, it, expect } from 'vitest';
import {
  produceMorningNityaCandidate,
  produceMadhyahnNityaCandidate,
  produceSandhyaNityaCandidate,
  produceNityaCandidate,
  MORNING_NITYA_NUDGE,
  MADHYAHN_NITYA_NUDGE,
  SANDHYA_NITYA_NUDGE,
  type DevoteeProfileForNitya,
} from './nitya-candidate-producer';

describe('nitya-candidate-producer', () => {
  const baseDevotee: DevoteeProfileForNitya = {
    id: 'user-nitya-108',
    full_name: 'Ananda Das',
    tradition: 'hindu',
    life_stage: 'grihastha',
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    latitude: 28.6139,
    longitude: 77.2090,
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 4,
    wants_nitya_reminders: true,
    wants_madhyahn_reminder: true,
    wants_evening_reminder: true,
    nitya_rhythm_mode: 'full_day',
    is_deleting: false,
  };

  describe('Morning Nitya candidate', () => {
    it('produces a valid morning candidate at 05:00 local time for opted-in devotee', () => {
      const candidate = produceMorningNityaCandidate(baseDevotee, '2026-09-23');
      expect(candidate).not.toBeNull();
      expect(candidate?.user_id).toBe('user-nitya-108');
      expect(candidate?.event_type).toBe('nitya');
      expect(candidate?.event_id).toBe('morning');
      expect(candidate?.local_date).toBe('2026-09-23');
      expect(candidate?.action_url).toBe('/nitya-karma');
      expect(candidate?.priority).toBe(30);
      expect(candidate?.title).toBe(MORNING_NITYA_NUDGE.hindu.title);
      expect(candidate?.body).toContain(MORNING_NITYA_NUDGE.hindu.body);
      // 05:00 IST = 23:30 UTC of previous day
      expect(candidate?.scheduled_for).toBe('2026-09-22T23:30:00.000Z');
      expect(candidate?.metadata).toMatchObject({ priority_class: 'approved_ritual_window' });
    });

    it('suppresses morning candidate if wants_nitya_reminders === false', () => {
      const optedOut: DevoteeProfileForNitya = { ...baseDevotee, wants_nitya_reminders: false };
      expect(produceMorningNityaCandidate(optedOut, '2026-09-23')).toBeNull();
    });

    it('suppresses morning candidate if devotee already started nitya karma today', () => {
      const candidate = produceMorningNityaCandidate(baseDevotee, '2026-09-23', { startedToday: true });
      expect(candidate).toBeNull();
    });

    it('suppresses morning candidate if devotee is marked for deletion', () => {
      const deleting: DevoteeProfileForNitya = { ...baseDevotee, is_deleting: true };
      expect(produceMorningNityaCandidate(deleting, '2026-09-23')).toBeNull();
    });

    it('suppresses morning candidate if 05:00 falls in quiet hours', () => {
      const quiet: DevoteeProfileForNitya = {
        ...baseDevotee,
        notification_quiet_hours_start: 22,
        notification_quiet_hours_end: 6, // 5 AM is inside quiet window
      };
      expect(produceMorningNityaCandidate(quiet, '2026-09-23')).toBeNull();
    });

    it('tailors morning copy by tradition accurately', () => {
      const sikh = produceMorningNityaCandidate({ ...baseDevotee, tradition: 'sikh' }, '2026-09-23');
      expect(sikh?.title).toBe(MORNING_NITYA_NUDGE.sikh.title);
      expect(sikh?.body).toContain(MORNING_NITYA_NUDGE.sikh.body);

      const buddhist = produceMorningNityaCandidate({ ...baseDevotee, tradition: 'buddhist' }, '2026-09-23');
      expect(buddhist?.title).toBe(MORNING_NITYA_NUDGE.buddhist.title);

      const jain = produceMorningNityaCandidate({ ...baseDevotee, tradition: 'jain' }, '2026-09-23');
      expect(jain?.title).toBe(MORNING_NITYA_NUDGE.jain.title);
    });
  });

  describe('Madhyahn (Midday) Nitya candidate', () => {
    it('produces a valid midday candidate at 12:00 local time for full_day opted-in devotee', () => {
      const candidate = produceMadhyahnNityaCandidate(baseDevotee, '2026-09-23');
      expect(candidate).not.toBeNull();
      expect(candidate?.user_id).toBe('user-nitya-108');
      expect(candidate?.event_type).toBe('nitya');
      expect(candidate?.event_id).toBe('madhyahn');
      expect(candidate?.local_date).toBe('2026-09-23');
      expect(candidate?.action_url).toBe('/nitya-karma');
      expect(candidate?.priority).toBe(30);
      expect(candidate?.title).toBe(MADHYAHN_NITYA_NUDGE.hindu.title);
      expect(candidate?.body).toBe(MADHYAHN_NITYA_NUDGE.hindu.body);
      // 12:00 IST = 06:30 UTC
      expect(candidate?.scheduled_for).toBe('2026-09-23T06:30:00.000Z');
      expect(candidate?.metadata).toMatchObject({ priority_class: 'approved_ritual_window' });
    });

    it('suppresses midday candidate if wants_madhyahn_reminder is not true', () => {
      expect(produceMadhyahnNityaCandidate({ ...baseDevotee, wants_madhyahn_reminder: false }, '2026-09-23')).toBeNull();
      expect(produceMadhyahnNityaCandidate({ ...baseDevotee, wants_madhyahn_reminder: null }, '2026-09-23')).toBeNull();
    });

    it('suppresses midday candidate if nitya_rhythm_mode is not full_day or advanced', () => {
      expect(produceMadhyahnNityaCandidate({ ...baseDevotee, nitya_rhythm_mode: 'morning_only' }, '2026-09-23')).toBeNull();
      expect(produceMadhyahnNityaCandidate({ ...baseDevotee, nitya_rhythm_mode: null }, '2026-09-23')).toBeNull();
    });

    it('suppresses midday candidate if 12:00 falls in quiet hours', () => {
      const quiet: DevoteeProfileForNitya = {
        ...baseDevotee,
        notification_quiet_hours_start: 11,
        notification_quiet_hours_end: 14,
      };
      expect(produceMadhyahnNityaCandidate(quiet, '2026-09-23')).toBeNull();
    });
  });

  describe('Sandhya (Evening) Nitya candidate', () => {
    it('produces a valid evening candidate at 18:00 local time for advanced rhythm devotee', () => {
      const candidate = produceSandhyaNityaCandidate({ ...baseDevotee, nitya_rhythm_mode: 'advanced' }, '2026-09-23');
      expect(candidate).not.toBeNull();
      expect(candidate?.user_id).toBe('user-nitya-108');
      expect(candidate?.event_type).toBe('nitya');
      expect(candidate?.event_id).toBe('sandhya');
      expect(candidate?.local_date).toBe('2026-09-23');
      expect(candidate?.action_url).toBe('/nitya-karma');
      expect(candidate?.priority).toBe(30);
      expect(candidate?.title).toBe(SANDHYA_NITYA_NUDGE.hindu.title);
      expect(candidate?.body).toBe(SANDHYA_NITYA_NUDGE.hindu.body);
      // 18:00 IST = 12:30 UTC
      expect(candidate?.scheduled_for).toBe('2026-09-23T12:30:00.000Z');
      expect(candidate?.metadata).toMatchObject({ priority_class: 'approved_ritual_window' });
    });

    it('suppresses evening candidate if wants_evening_reminder is not true', () => {
      expect(produceSandhyaNityaCandidate({ ...baseDevotee, wants_evening_reminder: false }, '2026-09-23')).toBeNull();
      expect(produceSandhyaNityaCandidate({ ...baseDevotee, wants_evening_reminder: null }, '2026-09-23')).toBeNull();
    });

    it('suppresses evening candidate if 18:00 falls in quiet hours', () => {
      const quiet: DevoteeProfileForNitya = {
        ...baseDevotee,
        notification_quiet_hours_start: 17,
        notification_quiet_hours_end: 21,
      };
      expect(produceSandhyaNityaCandidate(quiet, '2026-09-23')).toBeNull();
    });
  });

  describe('Universal dispatcher', () => {
    it('dispatches properly to each slot', () => {
      const morning = produceNityaCandidate(baseDevotee, 'morning', '2026-09-23');
      const madhyahn = produceNityaCandidate(baseDevotee, 'madhyahn', '2026-09-23');
      const sandhya = produceNityaCandidate(baseDevotee, 'sandhya', '2026-09-23');

      expect(morning?.event_id).toBe('morning');
      expect(madhyahn?.event_id).toBe('madhyahn');
      expect(sandhya?.event_id).toBe('sandhya');
    });
  });
});
