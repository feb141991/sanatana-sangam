import { describe, expect, it } from 'vitest';
import {
  deriveCandidateNotificationKey,
  parseCandidateNotificationKey,
} from './notification-candidate-key';

describe('notification-candidate-key', () => {
  describe('deriveCandidateNotificationKey', () => {
    it('formats observance keys with explicit lead-time instance', () => {
      const key = deriveCandidateNotificationKey({
        event_type: 'observance',
        event_id: 'diwali-2026',
        event_instance: 'D-1',
        local_date: '2026-11-07',
        audience_variant: 'general',
      });
      expect(key).toBe('observance:diwali-2026:D-1:2026-11-07:general');
    });

    it('defaults observance instance to D0 if omitted', () => {
      const key = deriveCandidateNotificationKey({
        event_type: 'festival',
        event_id: 'maha-shivaratri',
        local_date: '2026-03-08',
      });
      expect(key).toBe('festival:maha-shivaratri:D0:2026-03-08:general');
    });

    it('formats routine engagement keys with optional instance', () => {
      const keyWithoutInstance = deriveCandidateNotificationKey({
        event_type: 'dharm_veer',
        event_id: 'shivaji-maharaj',
        local_date: '2026-11-08',
        audience_variant: 'general',
      });
      expect(keyWithoutInstance).toBe('dharm_veer:shivaji-maharaj:2026-11-08:general');

      const keyWithInstance = deriveCandidateNotificationKey({
        event_type: 'quiz_daily',
        event_id: 'quiz-42',
        event_instance: 'morning',
        local_date: '2026-11-08',
        audience_variant: 'hindi',
      });
      expect(keyWithInstance).toBe('quiz_daily:quiz-42:morning:2026-11-08:hindi');
    });
  });

  describe('parseCandidateNotificationKey', () => {
    it('roundtrips observance keys', () => {
      const parsed = parseCandidateNotificationKey('observance:diwali-2026:D-1:2026-11-07:general');
      expect(parsed).toEqual({
        event_type: 'observance',
        event_id: 'diwali-2026',
        event_instance: 'D-1',
        local_date: '2026-11-07',
        audience_variant: 'general',
      });
    });

    it('roundtrips routine engagement keys', () => {
      const parsed4 = parseCandidateNotificationKey('dharm_veer:shivaji-maharaj:2026-11-08:general');
      expect(parsed4).toEqual({
        event_type: 'dharm_veer',
        event_id: 'shivaji-maharaj',
        event_instance: '',
        local_date: '2026-11-08',
        audience_variant: 'general',
      });

      const parsed5 = parseCandidateNotificationKey('quiz_daily:quiz-42:morning:2026-11-08:hindi');
      expect(parsed5).toEqual({
        event_type: 'quiz_daily',
        event_id: 'quiz-42',
        event_instance: 'morning',
        local_date: '2026-11-08',
        audience_variant: 'hindi',
      });
    });

    it('returns null on invalid or short strings', () => {
      expect(parseCandidateNotificationKey('')).toBeNull();
      expect(parseCandidateNotificationKey('foo:bar')).toBeNull();
    });
  });
});
