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
        quiz_reminder_time: '14:00',
      };

      const cand = produceQuizCandidate(devotee, '2026-11-08');
      expect(cand).not.toBeNull();
      expect(cand!.event_type).toBe('quiz');
      expect(cand!.action_url).toBe('/quiz');
      expect(cand!.title).toBe('Daily Dharma Quiz');
      expect(cand!.body).toBe('Test your dharmic knowledge with today’s reflection question.');
      expect(cand!.priority).toBe(60);
    });
  });

  describe('generateLearningEngagementCandidates', () => {
    const devoteeA: UnifiedLearningProfile = {
      id: 'devotee-a',
      tradition: 'hindu',
      language: 'en',
      timezone: 'Asia/Kolkata',
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
