import { describe, expect, it } from 'vitest';
import {
  getCompletedJapaUserIds,
  planNextJapaReminder,
  produceJapaCandidate,
  type DevoteeProfileForJapa,
} from './japa-candidate-producer';

describe('japa-candidate-producer', () => {
  const devotee: DevoteeProfileForJapa = {
    id: 'user-japa-1',
    timezone: 'Asia/Kolkata',
    japa_reminder_enabled: true,
    japa_reminder_time: '07:30',
  };

  it('plans the next future local slot for India and the Americas', () => {
    const india = planNextJapaReminder(devotee, new Date('2026-11-08T00:00:00.000Z'));
    const newYork = planNextJapaReminder(
      { ...devotee, timezone: 'America/New_York', japa_reminder_time: '07:00' },
      new Date('2026-11-08T00:00:00.000Z')
    );

    expect(india).toMatchObject({ localDate: '2026-11-08', timezone: 'Asia/Kolkata' });
    expect(india?.scheduledFor.toISOString()).toBe('2026-11-08T02:00:00.000Z');
    expect(newYork).toMatchObject({ localDate: '2026-11-08', timezone: 'America/New_York' });
    expect(newYork?.scheduledFor.toISOString()).toBe('2026-11-08T12:00:00.000Z');
  });

  it('moves an already-passed local reminder to the next local date', () => {
    const plan = planNextJapaReminder(devotee, new Date('2026-11-08T02:15:00.000Z'));

    expect(plan?.localDate).toBe('2026-11-09');
    expect(plan?.scheduledFor.toISOString()).toBe('2026-11-09T02:00:00.000Z');
  });

  it('uses the same 04:00 spiritual-date boundary as Japa completion', () => {
    const beforeBoundary = planNextJapaReminder({
      ...devotee,
      timezone: 'Europe/London',
      japa_reminder_time: '03:30',
    }, new Date('2026-11-08T00:00:00.000Z'));
    const atBoundary = planNextJapaReminder({
      ...devotee,
      timezone: 'Europe/London',
      japa_reminder_time: '04:00',
    }, new Date('2026-11-08T00:00:00.000Z'));

    expect(beforeBoundary?.localDate).toBe('2026-11-08');
    expect(beforeBoundary?.completionDate).toBe('2026-11-07');
    expect(atBoundary?.completionDate).toBe('2026-11-08');
  });

  it('moves quiet-hour adjustments across midnight to the correct local date', () => {
    const plan = planNextJapaReminder({
      ...devotee,
      timezone: 'Asia/Kolkata',
      japa_reminder_time: '21:30',
      notification_quiet_hours_start: 20,
      notification_quiet_hours_end: 23,
    }, new Date('2026-11-08T13:30:00.000Z')); // 19:00 local

    expect(plan?.localDate).toBe('2026-11-09');
    // Quiet-end + 1 hour is 00:00, preserving the user's 30-minute offset.
    expect(plan?.scheduledFor.toISOString()).toBe('2026-11-08T19:00:00.000Z');
    expect(plan?.expiresAt.toISOString()).toBe('2026-11-09T18:30:00.000Z');
  });

  it('expires a scheduled reminder at the next local midnight', () => {
    const plan = planNextJapaReminder(devotee, new Date('2026-11-08T00:00:00.000Z'));
    expect(plan?.expiresAt.toISOString()).toBe('2026-11-08T18:30:00.000Z');
  });

  it('does not create a reminder when the configured time is malformed', () => {
    expect(planNextJapaReminder({ ...devotee, japa_reminder_time: '25:90' }, new Date('2026-11-08T00:00:00.000Z'))).toBeNull();
  });

  it('produces candidate when enabled and not completed', () => {
    const plan = planNextJapaReminder(devotee, new Date('2026-11-08T00:00:00.000Z'))!;
    const cand = produceJapaCandidate(devotee, plan, false);
    expect(cand).not.toBeNull();
    expect(cand!.event_type).toBe('japa');
    expect(cand!.event_id).toBe('japa-daily');
    expect(cand!.local_date).toBe('2026-11-08');
    expect(cand!.scheduled_for).toBe(plan.scheduledFor.toISOString());
    expect(cand!.metadata).toMatchObject({
      completion_guard: 'japa',
      local_date: plan.localDate,
    });
    expect(cand!.action_url).toBe('/japa');
    expect(cand!.priority).toBe(50);
    expect(cand!.title).toBe('🔔 Time for Japa');
    expect(cand!.body).toBe('Your daily Japa practice awaits. Keep your streak alive 🙏');
  });

  it('suppresses candidate when devotee has already completed Japa', () => {
    const plan = planNextJapaReminder(devotee, new Date('2026-11-08T00:00:00.000Z'))!;
    const cand = produceJapaCandidate(devotee, plan, true);
    expect(cand).toBeNull();
  });

  it('suppresses candidate when japa_reminder_enabled is false', () => {
    const plan = planNextJapaReminder(devotee, new Date('2026-11-08T00:00:00.000Z'))!;
    const cand = produceJapaCandidate(
      { ...devotee, japa_reminder_enabled: false },
      plan,
      false
    );
    expect(cand).toBeNull();
  });

  it('defers send time outside quiet hours window', () => {
    const quietDevotee: DevoteeProfileForJapa = {
      id: 'user-quiet',
      timezone: 'Asia/Kolkata',
      japa_reminder_enabled: true,
      japa_reminder_time: '23:30',
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 6,
    };

    const plan = planNextJapaReminder(quietDevotee, new Date('2026-11-08T00:00:00.000Z'))!;
    const cand = produceJapaCandidate(quietDevotee, plan, false);
    expect(cand).not.toBeNull();
    const scheduled = new Date(cand!.scheduled_for);
    // 07:30 IST is 02:00 UTC
    expect(scheduled.toISOString()).toContain('T02:00:00.000Z');
  });

  it('fails closed when the completion query fails', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          in: () => ({
            eq: async () => ({ data: null, error: { message: 'database unavailable' } }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getCompletedJapaUserIds>[0];

    await expect(getCompletedJapaUserIds(supabase, ['user-japa-1'], '2026-11-08'))
      .rejects.toThrow('Could not verify Japa completion for 2026-11-08');
  });
});
