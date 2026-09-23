import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  produceMorningNityaCandidate,
  produceMadhyahnNityaCandidate,
  produceSandhyaNityaCandidate,
  type DevoteeProfileForNitya,
} from './nitya-candidate-producer';
import { resolveCandidates, resolvePriorityClass } from './notification-resolver';
import { getRoutinePipelineMode } from './notification-candidate-pipeline-mode';
import type { NotificationCandidate } from '@/types/database';

describe('nitya-migration-parity & pipeline exclusivity', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const baseDevotee: DevoteeProfileForNitya = {
    id: 'user-parity-nitya',
    full_name: 'Priya Sharma',
    tradition: 'hindu',
    life_stage: 'grihastha',
    gender_context: 'female',
    timezone: 'Asia/Kolkata',
    latitude: 19.0760,
    longitude: 72.8777,
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 4,
    wants_nitya_reminders: true,
    wants_madhyahn_reminder: true,
    wants_evening_reminder: true,
    nitya_rhythm_mode: 'full_day',
    is_deleting: false,
  };

  it('pipeline mode defaults to legacy and responds to overrides', () => {
    delete process.env.NOTIFICATION_ROUTINE_MODE_NITYA;
    expect(getRoutinePipelineMode('nitya')).toBe('legacy');

    process.env.NOTIFICATION_ROUTINE_MODE_NITYA = 'candidate';
    expect(getRoutinePipelineMode('nitya')).toBe('candidate');

    process.env.NOTIFICATION_ROUTINE_MODE_NITYA = 'disabled';
    expect(getRoutinePipelineMode('nitya')).toBe('disabled');
  });

  it('morning candidate maps to approved_ritual_window and is budget-exempt', () => {
    const candidate = produceMorningNityaCandidate(baseDevotee, '2026-11-08');
    expect(candidate).not.toBeNull();
    expect(candidate?.action_url).toBe('/nitya-karma');

    const fullCandidate: NotificationCandidate = {
      ...(candidate as any),
      id: 'cand-morning-1',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      dispatched_at: null,
      resolution_reason: null,
    };

    expect(resolvePriorityClass(fullCandidate)).toBe('approved_ritual_window');

    const result = resolveCandidates({
      candidates: [fullCandidate],
      now: new Date('2026-11-08T00:00:00.000Z'),
    });

    expect(result.accepted).toHaveLength(1);
    expect(result.suppressed).toHaveLength(0);
    expect(result.evaluations[0].priorityClass).toBe('approved_ritual_window');
  });

  it('madhyahn and sandhya candidates map to approved_ritual_window and pass resolver together', () => {
    const madhyahn = produceMadhyahnNityaCandidate(baseDevotee, '2026-11-08');
    const sandhya = produceSandhyaNityaCandidate(
      { ...baseDevotee, nitya_rhythm_mode: 'advanced' },
      '2026-11-08'
    );

    expect(madhyahn).not.toBeNull();
    expect(sandhya).not.toBeNull();

    const fullMadhyahn: NotificationCandidate = {
      ...(madhyahn as any),
      id: 'cand-madhyahn-1',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      dispatched_at: null,
      resolution_reason: null,
    };

    const fullSandhya: NotificationCandidate = {
      ...(sandhya as any),
      id: 'cand-sandhya-1',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      dispatched_at: null,
      resolution_reason: null,
    };

    expect(resolvePriorityClass(fullMadhyahn)).toBe('approved_ritual_window');
    expect(resolvePriorityClass(fullSandhya)).toBe('approved_ritual_window');

    const result = resolveCandidates({
      candidates: [fullMadhyahn, fullSandhya],
      now: new Date('2026-11-08T06:00:00.000Z'),
    });

    // Both are approved_ritual_window -> both accepted despite having 2 items!
    expect(result.accepted).toHaveLength(2);
    expect(result.suppressed).toHaveLength(0);
  });

  it('respects preference opt-outs for madhyahn and sandhya independently', () => {
    const optOutMadhyahn = produceMadhyahnNityaCandidate(
      { ...baseDevotee, wants_madhyahn_reminder: false },
      '2026-11-08'
    );
    expect(optOutMadhyahn).toBeNull();

    const optOutSandhya = produceSandhyaNityaCandidate(
      { ...baseDevotee, wants_evening_reminder: false },
      '2026-11-08'
    );
    expect(optOutSandhya).toBeNull();
  });
});
