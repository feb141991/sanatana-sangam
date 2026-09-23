import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cleanupNotificationCandidatesRetention,
  executeCandidateResolverPipeline,
} from './notification-resolver-pipeline';
import type { NotificationCandidate } from '@/types/database';

function makeCandidate(overrides: Partial<NotificationCandidate> = {}): NotificationCandidate {
  return {
    id: overrides.id ?? 'cand-1',
    user_id: overrides.user_id ?? 'user-1',
    event_type: overrides.event_type ?? 'devotional_engagement',
    event_id: overrides.event_id ?? 'prompt-1',
    event_instance: overrides.event_instance ?? '',
    local_date: overrides.local_date ?? '2026-11-08',
    audience_variant: overrides.audience_variant ?? 'general',
    scheduled_for: overrides.scheduled_for ?? '2026-11-08T02:30:00.000Z',
    expires_at: overrides.expires_at ?? '2026-11-08T18:00:00.000Z',
    priority: overrides.priority ?? 50,
    title: overrides.title ?? 'Test Title',
    body: overrides.body ?? 'Test Body',
    action_url: overrides.action_url ?? '/home',
    language: overrides.language ?? 'en',
    timezone: overrides.timezone ?? 'Asia/Kolkata',
    tradition: overrides.tradition ?? 'hindu',
    calendar_profile: overrides.calendar_profile ?? null,
    source_status: overrides.source_status ?? 'verified',
    source_refs: overrides.source_refs ?? {},
    metadata: overrides.metadata ?? {},
    status: overrides.status ?? 'pending',
    decision_reason: overrides.decision_reason ?? null,
    resolved_at: overrides.resolved_at ?? null,
    claimed_at: overrides.claimed_at ?? null,
    created_at: overrides.created_at ?? '2026-11-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-11-01T00:00:00.000Z',
  };
}

describe('notification-resolver-pipeline', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('skips execution when resolver is globally disabled and not dry-run', async () => {
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;

    const mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(),
    };

    const res = await executeCandidateResolverPipeline({
      supabase: mockSupabase as unknown as SupabaseClient,
      dryRun: false,
    });

    expect(res.ok).toBe(true);
    expect(res.skipped).toBe(true);
    expect(res.skipReason).toBe('resolver_globally_disabled');
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('executes in dryRun mode without database mutations', async () => {
    const candidate = makeCandidate({ id: 'cand-dry', event_type: 'devotional_engagement' });

    const mockCandidateQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [candidate], error: null }),
    };

    const mockScheduleQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (resolve: any) => resolve({ data: [], error: null }),
    };
    // Make .in() chainable and resolvable as a Promise
    mockScheduleQuery.in = vi.fn().mockReturnValue(mockScheduleQuery);

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_candidates') return mockCandidateQuery;
        if (table === 'notification_schedule') return mockScheduleQuery;
        if (table === 'notifications') return mockScheduleQuery;
        return {};
      }),
      rpc: vi.fn(),
    };

    const res = await executeCandidateResolverPipeline({
      supabase: mockSupabase as unknown as SupabaseClient,
      now: new Date('2026-11-08T02:00:00.000Z'),
      dryRun: true,
    });

    expect(res.ok).toBe(true);
    expect(res.dryRun).toBe(true);
    expect(res.acceptedCount).toBe(1);
    expect(res.promotedToScheduleCount).toBe(0);
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('promotes accepted candidates into notification_schedule and updates candidate records', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_DEVOTIONAL_ENGAGEMENT = 'candidate';

    const cand1 = makeCandidate({ id: 'cand-1', event_type: 'devotional_engagement', priority: 50 });
    const cand2 = makeCandidate({ id: 'cand-2', event_type: 'devotional_engagement', priority: 51 });
    const cand3 = makeCandidate({ id: 'cand-3', event_type: 'devotional_engagement', priority: 52 });

    const mockScheduleQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn(),
    };
    mockScheduleQuery.in = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mockSupabase = {
      rpc: vi.fn().mockImplementation((name: string) => name === 'claim_pending_notification_candidates'
        ? Promise.resolve({ data: [cand1, cand2, cand3], error: null })
        : Promise.resolve({ data: [{ promoted_count: 2, candidate_count: 3, audit_count: 3 }], error: null })),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_schedule') return mockScheduleQuery;
        if (table === 'notifications') return mockScheduleQuery;
        return {};
      }),
    };

    const res = await executeCandidateResolverPipeline({
      supabase: mockSupabase as unknown as SupabaseClient,
      now: new Date('2026-11-08T02:00:00.000Z'),
      dryRun: false,
    });

    expect(res.ok).toBe(true);
    expect(res.acceptedCount).toBe(2);
    expect(res.suppressedCount).toBe(1);
    const persistCall = mockSupabase.rpc.mock.calls.find(([name]) => name === 'persist_notification_candidate_resolution');
    expect(persistCall).toBeDefined();
    expect(persistCall?.[1].p_schedule_rows).toHaveLength(2);
    expect(persistCall?.[1].p_schedule_rows[0].notification_key).toBe('devotional_engagement:prompt-1:2026-11-08:general');
    expect(persistCall?.[1].p_candidate_updates).toHaveLength(3);
    expect(persistCall?.[1].p_audit_events).toHaveLength(3);
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  });

  it('fails closed if delivery-history lookup fails', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_DEVOTIONAL_ENGAGEMENT = 'candidate';
    const candidate = makeCandidate();
    const failedQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: null, error: { message: 'history unavailable' } }),
    };
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: [candidate], error: null }),
      from: vi.fn().mockReturnValue(failedQuery),
    };

    await expect(executeCandidateResolverPipeline({ supabase: supabase as unknown as SupabaseClient })).rejects.toThrow('history unavailable');
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('surfaces atomic persistence failure instead of reporting successful resolution', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_DEVOTIONAL_ENGAGEMENT = 'candidate';
    const candidate = makeCandidate();
    const okQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn(),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null }),
    };
    okQuery.in = vi.fn().mockReturnValue(okQuery);
    const supabase = {
      rpc: vi.fn().mockImplementation((name: string) => name === 'claim_pending_notification_candidates'
        ? Promise.resolve({ data: [candidate], error: null })
        : Promise.resolve({ data: null, error: { message: 'transaction rolled back' } })),
      from: vi.fn().mockReturnValue(okQuery),
    };

    await expect(executeCandidateResolverPipeline({ supabase: supabase as unknown as SupabaseClient })).rejects.toThrow('transaction rolled back');
  });

  it('purges terminal candidates and audit events older than 90 days', async () => {
    const mockCandDelete = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        lte: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [{ id: 'old-1' }, { id: 'old-2' }], error: null }),
        }),
      }),
    });

    const mockEventDelete = vi.fn().mockReturnValue({
      lte: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'event-old-1' }], error: null }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_candidates') {
          return { delete: mockCandDelete };
        }
        if (table === 'notification_resolver_events') {
          return { delete: mockEventDelete };
        }
        return {};
      }),
    };

    const res = await cleanupNotificationCandidatesRetention(mockSupabase as unknown as SupabaseClient, 90);
    expect(res.candidatesPurged).toBe(2);
    expect(res.eventsPurged).toBe(1);
  });
});
