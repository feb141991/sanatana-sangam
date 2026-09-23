import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEAD_DAYS,
  isValidObservanceReminderTime,
  mapProfileToObservancePreferences,
  sanitizeObservanceLeadDays,
  type ProfilePreferenceInput,
} from './observance-preferences';

describe('observance-preferences', () => {
  describe('mapProfileToObservancePreferences', () => {
    it('returns fail-closed disabled preferences for null/undefined profile', () => {
      const prefs = mapProfileToObservancePreferences(null, 'festival');
      expect(prefs.enabled).toBe(false);
      expect(prefs.tradition).toBeNull();
      expect(prefs.calendarProfile).toBeNull();
      expect(prefs.sampradaya).toBeNull();
      expect(prefs.leadDays).toEqual(DEFAULT_LEAD_DAYS);
    });

    it('isolates category opt-in between festival, vrat, and tithi', () => {
      const profile: ProfilePreferenceInput = {
        wants_festival_reminders: true,
        wants_vrat_reminders: false,
        wants_tithi_reminders: null,
      };

      expect(mapProfileToObservancePreferences(profile, 'festival').enabled).toBe(true);
      expect(mapProfileToObservancePreferences(profile, 'vrat').enabled).toBe(false);
      expect(mapProfileToObservancePreferences(profile, 'tithi').enabled).toBe(false);
    });

    it('fails closed on null or unset preference fields', () => {
      const profile: ProfilePreferenceInput = {};
      expect(mapProfileToObservancePreferences(profile, 'festival').enabled).toBe(false);
      expect(mapProfileToObservancePreferences(profile, 'vrat').enabled).toBe(false);
      expect(mapProfileToObservancePreferences(profile, 'tithi').enabled).toBe(false);
    });

    it('qualifies audience strictly from gender_context without fallback', () => {
      expect(mapProfileToObservancePreferences({ gender_context: 'female' }, 'festival').audience).toBe('female');
      expect(mapProfileToObservancePreferences({ gender_context: 'general' }, 'festival').audience).toBe('not_female');
      expect(mapProfileToObservancePreferences({ gender_context: null }, 'festival').audience).toBe('not_female');
      expect(mapProfileToObservancePreferences({}, 'festival').audience).toBe('not_female');
    });

    it('maps calendar profile, tradition, and sampradaya cleanly', () => {
      const profile: ProfilePreferenceInput = {
        tradition: 'hindu',
        calendar_profile: 'north_indian_purnimanta',
        sampradaya: 'gaudiya',
      };
      const prefs = mapProfileToObservancePreferences(profile, 'vrat');
      expect(prefs.tradition).toBe('hindu');
      expect(prefs.calendarProfile).toBe('north_indian_purnimanta');
      expect(prefs.sampradaya).toBe('gaudiya');
    });

    it('uses custom lead days when valid, preserves explicit empty selection, and defaults when absent', () => {
      const customProfile: ProfilePreferenceInput = {
        observance_reminder_lead_days: [0, 1, 3],
      };
      expect(mapProfileToObservancePreferences(customProfile, 'festival').leadDays).toEqual([0, 1, 3]);

      const emptyProfile: ProfilePreferenceInput = {
        observance_reminder_lead_days: [],
      };
      expect(mapProfileToObservancePreferences(emptyProfile, 'festival').leadDays).toEqual([]);
      expect(mapProfileToObservancePreferences({}, 'festival').leadDays).toEqual(DEFAULT_LEAD_DAYS);
    });
  });

  describe('isValidObservanceReminderTime', () => {
    it('accepts valid HH:MM 24-hour time strings', () => {
      expect(isValidObservanceReminderTime('00:00')).toBe(true);
      expect(isValidObservanceReminderTime('08:00')).toBe(true);
      expect(isValidObservanceReminderTime('12:30')).toBe(true);
      expect(isValidObservanceReminderTime('23:59')).toBe(true);
    });

    it('rejects invalid time strings and types', () => {
      expect(isValidObservanceReminderTime('24:00')).toBe(false);
      expect(isValidObservanceReminderTime('25:30')).toBe(false);
      expect(isValidObservanceReminderTime('8:00')).toBe(false);
      expect(isValidObservanceReminderTime('08:60')).toBe(false);
      expect(isValidObservanceReminderTime('morning')).toBe(false);
      expect(isValidObservanceReminderTime(null)).toBe(false);
      expect(isValidObservanceReminderTime(undefined)).toBe(false);
      expect(isValidObservanceReminderTime(800)).toBe(false);
    });
  });

  describe('sanitizeObservanceLeadDays', () => {
    it('cleans, deduplicates, and sorts lead days', () => {
      expect(sanitizeObservanceLeadDays([7, 1, 1, 0])).toEqual([0, 1, 7]);
      expect(sanitizeObservanceLeadDays([1, 14, 7])).toEqual([1, 7, 14]);
    });

    it('filters out negative or excessive numbers and non-integers', () => {
      expect(sanitizeObservanceLeadDays([-1, 0, 1.5, 7, 100])).toEqual([0, 7]);
    });

    it('returns null for non-array inputs or empty results', () => {
      expect(sanitizeObservanceLeadDays(null)).toBeNull();
      expect(sanitizeObservanceLeadDays('not an array')).toBeNull();
      expect(sanitizeObservanceLeadDays([])).toEqual([]);
    });
  });
});
