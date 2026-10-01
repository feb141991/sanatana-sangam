import { describe, it, expect } from 'vitest';
import { classifyCohort, cohortKey, NOTIFICATION_OPT_IN_TYPES } from './notification-cohort';

describe('classifyCohort', () => {
  it('returns no opt-ins and ineligible for a null/undefined profile', () => {
    expect(classifyCohort(null)).toEqual({ optedInto: [], eligibleForAnyDelivery: false });
    expect(classifyCohort(undefined)).toEqual({ optedInto: [], eligibleForAnyDelivery: false });
  });

  it('treats absent, null, and false identically as "not opted in" -- never assumes opt-in', () => {
    const absent = classifyCohort({});
    const explicitNull = classifyCohort({ japa_reminder_enabled: null });
    const explicitFalse = classifyCohort({ japa_reminder_enabled: false });
    expect(absent.optedInto).toEqual([]);
    expect(explicitNull.optedInto).toEqual([]);
    expect(explicitFalse.optedInto).toEqual([]);
  });

  it('includes a type only when its flag is exactly true', () => {
    const result = classifyCohort({
      japa_reminder_enabled: true,
      wants_shloka_reminders: true,
      wants_nitya_reminders: false,
    });
    expect(result.optedInto.sort()).toEqual(['japa', 'shloka']);
  });

  it('is eligible for delivery only when opted into at least one type and not deleting', () => {
    expect(classifyCohort({ japa_reminder_enabled: true }).eligibleForAnyDelivery).toBe(true);
    expect(classifyCohort({ japa_reminder_enabled: true, is_deleting: true }).eligibleForAnyDelivery).toBe(false);
    expect(classifyCohort({ japa_reminder_enabled: false }).eligibleForAnyDelivery).toBe(false);
    expect(classifyCohort({}).eligibleForAnyDelivery).toBe(false);
  });

  it('covers every known opt-in type without throwing', () => {
    const allOn = Object.fromEntries(
      ['japa_reminder_enabled', 'wants_shloka_reminders', 'wants_nitya_reminders',
        'wants_sankalpa_midpoint_reminders', 'wants_festival_reminders', 'wants_vrat_reminders',
        'wants_tithi_reminders', 'wants_community_notifications', 'wants_family_notifications']
        .map((key) => [key, true]),
    );
    const result = classifyCohort(allOn);
    expect(result.optedInto.sort()).toEqual([...NOTIFICATION_OPT_IN_TYPES].sort());
  });
});

describe('cohortKey', () => {
  it('returns "none" for an empty opt-in set', () => {
    expect(cohortKey({ optedInto: [], eligibleForAnyDelivery: false })).toBe('none');
  });

  it('is order-independent -- same set, different array order, same key', () => {
    const a = cohortKey({ optedInto: ['japa', 'shloka'], eligibleForAnyDelivery: true });
    const b = cohortKey({ optedInto: ['shloka', 'japa'], eligibleForAnyDelivery: true });
    expect(a).toBe(b);
  });

  it('is distinct for distinct opt-in sets', () => {
    const japaOnly = cohortKey({ optedInto: ['japa'], eligibleForAnyDelivery: true });
    const japaAndShloka = cohortKey({ optedInto: ['japa', 'shloka'], eligibleForAnyDelivery: true });
    expect(japaOnly).not.toBe(japaAndShloka);
  });
});
