import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    } as any;

    const res = await executeCandidateResolverPipeline({
      supabase: mockSupabase,
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
        return {};
      }),
      rpc: vi.fn(),
    } as any;

    const res = await executeCandidateResolverPipeline({
      supabase: mockSupabase,
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

    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'sched-1' }, { id: 'sched-2' }], error: null }),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'event-1' }, { id: 'event-2' }, { id: 'event-3' }], error: null }),
    });

    const mockScheduleQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn(),
      upsert: mockUpsert,
    };
    mockScheduleQuery.in = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: [cand1, cand2, cand3], error: null }),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_schedule') return mockScheduleQuery;
        if (table === 'notification_candidates') return { update: mockUpdate };
        if (table === 'notification_resolver_events') return { insert: mockInsert };
        return {};
      }),
    } as any;

    const res = await executeCandidateResolverPipeline({
      supabase: mockSupabase,
      now: new Date('2026-11-08T02:00:00.000Z'),
      dryRun: false,
    });

    expect(res.ok).toBe(true);
    expect(res.acceptedCount).toBe(2);
    expect(res.deferredCount).toBe(1);
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    // Verify notification_schedule payload
    const upsertCall = mockUpsert.mock.calls[0];
    const upsertRows = upsertCall[0];
    const upsertOptions = upsertCall[1];
    expect(upsertOptions).toEqual({ onConflict: 'user_id,notification_key' });
    expect(upsertRows).toHaveLength(2);
    expect(upsertRows[0].notification_key).toBe('devotional_engagement:prompt-1:2026-11-08:general');
    expect(upsertRows[0].status).toBe('pending');

    // Verify updates to notification_candidates
    expect(mockUpdate).toHaveBeenCalledTimes(3);

    // Verify audit logs written
    expect(mockInsert).toHaveBeenCalledTimes(1);
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
    } as any;

    const res = await cleanupNotificationCandidatesRetention(mockSupabase, 90);
    expect(res.candidatesPurged).toBe(2);
    expect(res.eventsPurged).toBe(1);
  });
});
