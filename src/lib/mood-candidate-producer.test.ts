import { describe, it, expect } from 'vitest';
import {
  produceMoodCandidate,
  getMoodPrompt,
  MIDDAY_PROMPTS_BY_TRADITION,
  EVENING_PROMPTS_BY_TRADITION,
  type DevoteeProfileForMood,
} from './mood-candidate-producer';

describe('mood-candidate-producer', () => {
  const baseDevotee: DevoteeProfileForMood = {
    id: 'user-mood-123',
    tradition: 'hindu',
    timezone: 'Asia/Kolkata',
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    is_deleting: false,
  };

  it('produces a valid midday candidate at 12:00 local time', () => {
    const candidate = produceMoodCandidate(baseDevotee, 'midday', '2026-09-23', { promptIndex: 0 });
    expect(candidate).not.toBeNull();
    expect(candidate?.user_id).toBe('user-mood-123');
    expect(candidate?.event_type).toBe('mood');
    expect(candidate?.event_id).toBe('midday');
    expect(candidate?.event_instance).toBe('');
    expect(candidate?.local_date).toBe('2026-09-23');
    expect(candidate?.action_url).toBe('/discover/mood');
    expect(candidate?.title).toBe('Midday check-in 🌿');
    expect(candidate?.body).toBe(`${MIDDAY_PROMPTS_BY_TRADITION.hindu[0]} Let scripture meet your mood.`);
    expect(candidate?.priority).toBe(60);
    expect(candidate?.scheduled_for).toBe('2026-09-23T06:30:00.000Z'); // 12:00 IST = 06:30 UTC
  });

  it('produces a valid evening candidate at 18:00 local time', () => {
    const candidate = produceMoodCandidate(baseDevotee, 'evening', '2026-09-23', { promptIndex: 1 });
    expect(candidate).not.toBeNull();
    expect(candidate?.user_id).toBe('user-mood-123');
    expect(candidate?.event_type).toBe('mood');
    expect(candidate?.event_id).toBe('evening');
    expect(candidate?.local_date).toBe('2026-09-23');
    expect(candidate?.action_url).toBe('/discover/mood');
    expect(candidate?.title).toBe('🌙 Evening check-in');
    expect(candidate?.body).toBe(`${EVENING_PROMPTS_BY_TRADITION.hindu[1]} Let scripture meet your mood.`);
    expect(candidate?.priority).toBe(60);
    expect(candidate?.scheduled_for).toBe('2026-09-23T12:30:00.000Z'); // 18:00 IST = 12:30 UTC
  });

  it('suppresses candidate if devotee account is marked for deletion', () => {
    const deletingDevotee: DevoteeProfileForMood = {
      ...baseDevotee,
      is_deleting: true,
    };
    const candidate = produceMoodCandidate(deletingDevotee, 'midday', '2026-09-23');
    expect(candidate).toBeNull();
  });

  it('suppresses candidate if scheduled hour falls inside quiet hours', () => {
    // Night shift worker: sleeps 10:00 to 17:00
    const shiftWorker: DevoteeProfileForMood = {
      ...baseDevotee,
      notification_quiet_hours_start: 10,
      notification_quiet_hours_end: 17,
    };
    // 12:00 noon falls inside 10:00 - 17:00 quiet hours
    const middayCandidate = produceMoodCandidate(shiftWorker, 'midday', '2026-09-23');
    expect(middayCandidate).toBeNull();

    // 18:00 is outside quiet hours
    const eveningCandidate = produceMoodCandidate(shiftWorker, 'evening', '2026-09-23');
    expect(eveningCandidate).not.toBeNull();
  });

  it('selects tradition-tailored prompts accurately', () => {
    const sikhDevotee: DevoteeProfileForMood = {
      ...baseDevotee,
      tradition: 'sikh',
    };
    const midday = produceMoodCandidate(sikhDevotee, 'midday', '2026-09-23', { promptIndex: 0 });
    expect(midday?.body).toContain(MIDDAY_PROMPTS_BY_TRADITION.sikh[0]);

    const evening = produceMoodCandidate(sikhDevotee, 'evening', '2026-09-23', { promptIndex: 0 });
    expect(evening?.body).toContain(EVENING_PROMPTS_BY_TRADITION.sikh[0]);

    const jainDevotee: DevoteeProfileForMood = {
      ...baseDevotee,
      tradition: 'jain',
    };
    const jainMidday = produceMoodCandidate(jainDevotee, 'midday', '2026-09-23', { promptIndex: 0 });
    expect(jainMidday?.body).toContain(MIDDAY_PROMPTS_BY_TRADITION.jain[0]);
  });

  it('allows custom title and body overrides', () => {
    const candidate = produceMoodCandidate(baseDevotee, 'midday', '2026-09-23', {
      customTitle: 'Special Reflection',
      customBody: 'How is your stillness today?',
    });
    expect(candidate?.title).toBe('Special Reflection');
    expect(candidate?.body).toBe('How is your stillness today?');
  });
});
