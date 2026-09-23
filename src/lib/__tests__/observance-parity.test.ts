import { describe, expect, it } from 'vitest';
import { run60DayObservanceParityAudit } from '../observance-parity-engine';

describe('60-day observance shadow parity audit', () => {
  const result = run60DayObservanceParityAudit('2026-10-01', 60);

  it('evaluates all 14 representative profiles over the 60-day horizon', () => {
    expect(result.profileCount).toBe(14);
    expect(result.totalDays).toBe(60);
    expect(result.scheduledTotalCandidates).toBeGreaterThan(0);
  });

  it('guarantees zero key collisions with legacy notifications (observance-v1 prefix)', () => {
    expect(result.keyCollisionCount).toBe(0);
    for (const cand of result.scheduledCandidates) {
      expect(cand.notification_key).toMatch(/^observance-v1:[a-zA-Z0-9_-]+:d[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:(general|female)$/);
    }
  });

  it('guarantees 100% budget exemption compliance for explicit observance reminders', () => {
    expect(result.budgetExemptionCompliance).toBe(100);
    for (const cand of result.scheduledCandidates) {
      expect(cand.metadata.budget_class).toBe('explicit_observance');
      expect(cand.metadata.budget_exempt).toBe(true);
    }
  });

  it('strictly excludes accounts pending deletion', () => {
    const deletingCandidates = result.scheduledCandidates.filter(
      (c) => c.user_id === 'devotee-account-deleting'
    );
    expect(deletingCandidates).toHaveLength(0);
    expect(result.suppressedReasonsSummary['account_deletion_pending']).toBeGreaterThan(0);
  });

  it('strictly excludes candidates during local quiet hours conflicts', () => {
    const quietConflictCandidates = result.scheduledCandidates.filter(
      (c) => c.user_id === 'devotee-quiet-hours-conflict'
    );
    expect(quietConflictCandidates).toHaveLength(0);
    expect(result.quietHoursSuppressedCount).toBeGreaterThan(0);
  });

  it('strictly suppresses incomplete multi-day series across all profiles', () => {
    const incompleteCandidates = result.scheduledCandidates.filter(
      (c) => c.metadata.slug === 'navratri-day-incomplete'
    );
    expect(incompleteCandidates).toHaveLength(0);
    expect(result.incompleteSeriesSuppressedCount).toBeGreaterThan(0);
  });

  it('strictly enforces audience filtering for women-focused vrats', () => {
    const maleUsers = ['devotee-uk-gaudiya-male', 'devotee-us-la-male'];
    const maleFemaleVrats = result.scheduledCandidates.filter(
      (c) =>
        maleUsers.includes(c.user_id) &&
        c.metadata.slug === 'karva-chauth'
    );
    expect(maleFemaleVrats).toHaveLength(0);
    expect(result.audienceSuppressedCount).toBeGreaterThan(0);
  });

  it('respects granular preference isolation between festivals and vrats', () => {
    const festivalOnlyCandidates = result.scheduledCandidates.filter(
      (c) => c.user_id === 'devotee-festivals-only'
    );
    expect(festivalOnlyCandidates.length).toBeGreaterThan(0);
    expect(festivalOnlyCandidates.every((c) => c.notification_type === 'festival')).toBe(true);

    const vratOnlyCandidates = result.scheduledCandidates.filter(
      (c) => c.user_id === 'devotee-vrats-only'
    );
    expect(vratOnlyCandidates.length).toBeGreaterThan(0);
    expect(vratOnlyCandidates.every((c) => c.notification_type === 'vrat')).toBe(true);
  });

  it('delivers expanded timezone coverage for Western timezones compared to single-UTC legacy cron', () => {
    // Legacy ran at 07:00 UTC (~02:00 or ~03:00 Eastern/Pacific), completely missing their 9 AM local morning window.
    // The scheduled producer correctly resolves send instants for US Eastern and US Pacific.
    const usNyCandidates = result.scheduledCandidates.filter(
      (c) => c.user_id === 'devotee-us-ny-female'
    );
    const usLaCandidates = result.scheduledCandidates.filter(
      (c) => c.user_id === 'devotee-us-la-male'
    );
    expect(usNyCandidates.length).toBeGreaterThan(0);
    expect(usLaCandidates.length).toBeGreaterThan(0);

    const legacyNyCount = result.legacyNotifications.filter(
      (l) => l.user_id === 'devotee-us-ny-female'
    ).length;
    const legacyLaCount = result.legacyNotifications.filter(
      (l) => l.user_id === 'devotee-us-la-male'
    ).length;

    // Proves the new scheduler fixes the legacy timing defect
    expect(legacyNyCount).toBe(0);
    expect(legacyLaCount).toBe(0);
  });
});
