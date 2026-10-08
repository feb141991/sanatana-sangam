import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { produceDharmVeerCandidate } from './dharm-veer-candidate-producer';
import { produceQuizCandidate } from './quiz-candidate-producer';
import {
  generateLearningEngagementCandidates,
  type UnifiedLearningProfile,
} from './learning-pilot-scheduler';

describe('learning-pilot-scheduler', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('produceDharmVeerCandidate', () => {
    it('produces a source-backed candidate with exact canonical route and clean copy', () => {
      const devotee = {
        id: 'devotee-1',
        tradition: 'hindu',
        language: 'en',
        timezone: 'Asia/Kolkata',
        preferred_reminder_time: '09:00',
      };

      const cand = produceDharmVeerCandidate(devotee, '2026-11-08');
      expect(cand).not.toBeNull();
      expect(cand!.event_type).toBe('dharm_veer');
      expect(cand!.action_url).toMatch(/^\/dharm-veer\/[a-z0-9-]+$/);
      expect(cand!.title).toContain('Dharm Veer:');
      expect(cand!.body).toBeTruthy();
      // Verify no fabricated quote quotes
      expect(cand!.body).not.toContain('"');
      expect(cand!.priority).toBe(60);
      expect(cand!.source_status).toBe('verified');
      expect(cand!.source_refs).toBeDefined();
    });

    it('defers send time outside quiet hours window', () => {
      const devotee = {
        id: 'devotee-quiet',
        timezone: 'Asia/Kolkata',
        preferred_reminder_time: '23:00', // 11 PM
        notification_quiet_hours_start: 22, // 10 PM
        notification_quiet_hours_end: 6, // 6 AM
      };

      const cand = produceDharmVeerCandidate(devotee, '2026-11-08');
      expect(cand).not.toBeNull();
      // Should be deferred past 6 AM
      const scheduledDate = new Date(cand!.scheduled_for);
      // Asia/Kolkata is UTC+5:30, so 07:00 IST is 01:30 UTC
      expect(scheduledDate.toISOString()).toContain('T01:30:00.000Z');
    });
  });

  describe('produceQuizCandidate', () => {
    it('produces a candidate routing strictly to /quiz with dignified copy', () => {
      const devotee = {
        id: 'devotee-2',
        tradition: 'hindu',
        language: 'en',
        timezone: 'Asia/Kolkata',
        quiz_reminder_enabled: true,
        quiz_reminder_time: '14:00',
      };

      const cand = produceQuizCandidate(devotee, '2026-11-08');
      expect(cand).not.toBeNull();
      expect(cand!.event_type).toBe('quiz');
      expect(cand!.action_url).toBe('/quiz');
      expect(cand!.event_instance).toBe('available');
      expect(cand!.title).toBe('Today’s Daily Quiz is ready');
      expect(cand!.priority).toBe(50);
    });

    it('does not create a quiz candidate without explicit opt-in', () => {
      expect(produceQuizCandidate({ id: 'opt-out', timezone: 'Asia/Kolkata' }, '2026-11-08')).toBeNull();
      expect(produceQuizCandidate({ id: 'opt-out', timezone: 'Asia/Kolkata', quiz_reminder_enabled: false }, '2026-11-08')).toBeNull();
    });

    it('creates a separately keyed 6 PM reminder candidate', () => {
      const cand = produceQuizCandidate({
        id: 'quiz-user',
        timezone: 'Asia/Kolkata',
        quiz_reminder_enabled: true,
      }, '2026-11-08', 'evening_nudge');

      expect(cand?.event_instance).toBe('evening_nudge');
      expect(cand?.scheduled_for).toBe('2026-11-08T12:30:00.000Z');
      expect(cand?.expires_at).toBe('2026-11-08T15:15:00.000Z');
      expect(cand?.title).toBe('A gentle quiz reminder');
    });

    it('keeps the idempotency key stable if the user changes language that day', () => {
      const english = produceQuizCandidate({
        id: 'quiz-user',
        timezone: 'Asia/Kolkata',
        quiz_reminder_enabled: true,
        language: 'en',
      }, '2026-11-08', 'available');
      const hindi = produceQuizCandidate({
        id: 'quiz-user',
        timezone: 'Asia/Kolkata',
        quiz_reminder_enabled: true,
        language: 'hi',
      }, '2026-11-08', 'available');

      expect(english?.audience_variant).toBe(hindi?.audience_variant);
      expect(english?.event_id).toBe(hindi?.event_id);
      expect(english?.event_instance).toBe(hindi?.event_instance);
      expect(english?.language).toBe('en');
      expect(hindi?.language).toBe('hi');
    });

    it('creates a stage only within its per-user local delivery window', async () => {
      const { getDueQuizReminderStage } = await import('./quiz-candidate-producer');
      const user = {
        id: 'quiz-user',
        timezone: 'Asia/Kolkata',
        quiz_reminder_enabled: true,
        quiz_reminder_time: '08:00',
      };
      expect(getDueQuizReminderStage(user, '2026-11-08', new Date('2026-11-08T02:35:00.000Z'))).toBe('available');
      expect(getDueQuizReminderStage(user, '2026-11-08', new Date('2026-11-08T12:35:00.000Z'))).toBe('evening_nudge');
      expect(getDueQuizReminderStage(user, '2026-11-08', new Date('2026-11-08T16:00:00.000Z'))).toBeNull();
    });
  });

  describe('generateLearningEngagementCandidates', () => {
    const devoteeA: UnifiedLearningProfile = {
      id: 'devotee-a',
      tradition: 'hindu',
      language: 'en',
      timezone: 'Asia/Kolkata',
      quiz_reminder_enabled: true,
      dharmVeerEnabled: true,
      quizEnabled: true,
    };

    const devoteeDeleting: UnifiedLearningProfile = {
      id: 'devotee-del',
      is_deleting: true,
    };

    it('enforces single learning slot per devotee and date', async () => {
      const dates = ['2026-11-01', '2026-11-02', '2026-11-03'];

      const res = await generateLearningEngagementCandidates({
        devotees: [devoteeA, devoteeDeleting],
        dates,
        dryRun: true,
      });

      expect(res.ok).toBe(true);
      expect(res.dryRun).toBe(true);
      // Deleting devotee produces 0 candidates
      // Devotee A produces exactly 1 candidate per date (total 3)
      expect(res.totalCandidates).toBe(3);
      expect(res.candidates).toHaveLength(3);

      const datesSeen = new Set(res.candidates.map((c) => c.local_date));
      expect(datesSeen.size).toBe(3);
    });

    it('respects default-off kill switches during live run', async () => {
      delete process.env.NOTIFICATION_RESOLVER_ENABLED;

      const res = await generateLearningEngagementCandidates({
        devotees: [devoteeA],
        dates: ['2026-11-01'],
        dryRun: false,
      });

      expect(res.skipped).toBe(true);
      expect(res.skipReason).toBe('resolver_globally_disabled');
      expect(res.totalCandidates).toBe(0);
    });

    it('upserts to notification_candidates idempotently when live and enabled', async () => {
      process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
      process.env.NOTIFICATION_CANDIDATE_MODE_DHARM_VEER = 'candidate';
      process.env.NOTIFICATION_CANDIDATE_MODE_QUIZ = 'candidate';

      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'cand-1' }], error: null }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          upsert: mockUpsert,
        }),
      } as any;

      const res = await generateLearningEngagementCandidates({
        devotees: [devoteeA],
        dates: ['2026-11-01'],
        dryRun: false,
        supabase: mockSupabase,
      });

      expect(res.ok).toBe(true);
      expect(res.totalCandidates).toBe(1);
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(mockUpsert.mock.calls[0][1]).toEqual({
        onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
        ignoreDuplicates: true,
      });
    });
  });
});
