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

function makeReadQuery(result: { data: unknown; error: unknown }) {
  const query: any = {};
  for (const method of ['select', 'in', 'gte', 'lt', 'eq', 'order', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
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

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_candidates') return mockCandidateQuery;
        if (table === 'notification_schedule' || table === 'notifications' || table === 'profiles') return makeReadQuery({ data: [], error: null });
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

    const mockSupabase = {
      rpc: vi.fn().mockImplementation((name: string) => {
        if (name === 'try_acquire_notification_resolver_lock') return Promise.resolve({ data: true, error: null });
        if (name === 'claim_pending_notification_candidates') return Promise.resolve({ data: [cand1, cand2, cand3], error: null });
        if (name === 'persist_notification_candidate_resolution_with_lock') {
          return Promise.resolve({ data: [{ promoted_count: 3, candidate_count: 3, audit_count: 3 }], error: null });
        }
        return Promise.resolve({ data: true, error: null });
      }),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_schedule' || table === 'notifications' || table === 'profiles') return makeReadQuery({ data: [], error: null });
        return {};
      }),
    };

    const res = await executeCandidateResolverPipeline({
      supabase: mockSupabase as unknown as SupabaseClient,
      now: new Date('2026-11-08T02:00:00.000Z'),
      dryRun: false,
    });

    expect(res.ok).toBe(true);
    expect(res.acceptedCount).toBe(3);
    expect(res.suppressedCount).toBe(0);
    const persistCall = mockSupabase.rpc.mock.calls.find(([name]) => name === 'persist_notification_candidate_resolution_with_lock');
    expect(persistCall).toBeDefined();
    expect(persistCall?.[1].p_schedule_rows).toHaveLength(3);
    expect(persistCall?.[1].p_schedule_rows[0].notification_key).toBe('devotional_engagement:prompt-1:2026-11-08:general');
    expect(persistCall?.[1].p_candidate_updates).toHaveLength(3);
    expect(persistCall?.[1].p_audit_events).toHaveLength(3);
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(5);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('release_notification_resolver_lock', expect.objectContaining({ p_owner_id: expect.any(String) }));
  });

  it('uses profile quiet hours and local-date schedule history when spacing candidates', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_MOOD = 'candidate';
    const candidate = makeCandidate({
      id: 'mood-candidate',
      event_type: 'mood',
      local_date: '2026-11-08',
      scheduled_for: '2026-11-08T02:00:00.000Z', // 07:30 Asia/Kolkata
      expires_at: '2026-11-08T18:00:00.000Z',
      timezone: 'Asia/Kolkata',
    });
    const priorSchedule = {
      id: 'prior-sattvic',
      user_id: 'user-1',
      notification_type: 'sattvic_reminder',
      send_at: '2026-11-07T23:30:00.000Z', // 05:00 on Nov 8 in Kolkata
      status: 'sent',
      notification_key: 'sattvic_reminder:reminder-1:daily:2026-11-08:en',
      metadata: {},
    };
    const persistedArgs: Array<{
      p_schedule_rows: Array<{
        send_at: string;
        metadata: {
          delivery_cadence?: { delay_minutes?: number; policy_version?: string };
        };
      }>;
    }> = [];
    const historyQuery = makeReadQuery({ data: [priorSchedule], error: null });
    const supabase = {
      rpc: vi.fn().mockImplementation((name: string, args: any) => {
        if (name === 'try_acquire_notification_resolver_lock') return Promise.resolve({ data: true, error: null });
        if (name === 'claim_pending_notification_candidates') return Promise.resolve({ data: [candidate], error: null });
        if (name === 'persist_notification_candidate_resolution_with_lock') persistedArgs.push(args);
        return Promise.resolve({ data: [{ promoted_count: 1, candidate_count: 1, audit_count: 1 }], error: null });
      }),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_schedule') return historyQuery;
        if (table === 'notifications') return makeReadQuery({ data: [], error: null });
        if (table === 'profiles') return makeReadQuery({
          data: [{ id: 'user-1', timezone: 'Asia/Kolkata', notification_quiet_hours_start: 7, notification_quiet_hours_end: 9 }],
          error: null,
        });
        return {};
      }),
    };

    const result = await executeCandidateResolverPipeline({
      supabase: supabase as unknown as SupabaseClient,
      now: new Date('2026-11-07T17:00:00.000Z'), // 22:30 local on the prior date
    });

    expect(result.acceptedCount).toBe(1);
    expect(historyQuery.gte).toHaveBeenCalledWith('send_at', '2026-11-07T10:00:00.000Z');
    expect(persistedArgs[0].p_schedule_rows[0].send_at).toBe('2026-11-08T03:30:00.000Z'); // 09:00 local, after quiet hours
    expect(persistedArgs[0].p_schedule_rows[0].metadata.delivery_cadence?.delay_minutes).toBe(90);
    expect(persistedArgs[0].p_schedule_rows[0].metadata.delivery_cadence?.policy_version).toBe('engagement-cadence-v2');
  });

  it('fails closed if delivery-history lookup fails', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_DEVOTIONAL_ENGAGEMENT = 'candidate';
    const candidate = makeCandidate();
    const supabase = {
      rpc: vi.fn().mockImplementation((name: string) => name === 'try_acquire_notification_resolver_lock'
        ? Promise.resolve({ data: true, error: null })
        : Promise.resolve({ data: [candidate], error: null })),
      from: vi.fn().mockImplementation(() => makeReadQuery({ data: null, error: { message: 'history unavailable' } })),
    };

    await expect(executeCandidateResolverPipeline({ supabase: supabase as unknown as SupabaseClient })).rejects.toThrow('history unavailable');
    expect(supabase.rpc).toHaveBeenCalledWith('claim_pending_notification_candidates', expect.anything());
    expect(supabase.rpc).not.toHaveBeenCalledWith('persist_notification_candidate_resolution_with_lock', expect.anything());
  });

  it('surfaces atomic persistence failure instead of reporting successful resolution', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_DEVOTIONAL_ENGAGEMENT = 'candidate';
    const candidate = makeCandidate();
    const supabase = {
      rpc: vi.fn().mockImplementation((name: string) => {
        if (name === 'try_acquire_notification_resolver_lock') return Promise.resolve({ data: true, error: null });
        if (name === 'claim_pending_notification_candidates') return Promise.resolve({ data: [candidate], error: null });
        if (name === 'persist_notification_candidate_resolution_with_lock') {
          return Promise.resolve({ data: null, error: { message: 'transaction rolled back' } });
        }
        return Promise.resolve({ data: true, error: null });
      }),
      from: vi.fn().mockImplementation(() => makeReadQuery({ data: [], error: null })),
    };

    await expect(executeCandidateResolverPipeline({ supabase: supabase as unknown as SupabaseClient })).rejects.toThrow('transaction rolled back');
  });

  it('skips a second resolver run while the database lease is held', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
      from: vi.fn(),
    };

    const result = await executeCandidateResolverPipeline({ supabase: supabase as unknown as SupabaseClient });

    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('resolver_run_in_progress');
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('requeues claimed candidates when the atomic quota guard detects changed history', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_DEVOTIONAL_ENGAGEMENT = 'candidate';
    const candidate = makeCandidate({ id: 'candidate-after-conflict' });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateIn = vi.fn().mockReturnValue({ eq: updateEq });
    const updateCandidates = vi.fn().mockReturnValue({ in: updateIn });
    const supabase = {
      rpc: vi.fn().mockImplementation((name: string) => {
        if (name === 'try_acquire_notification_resolver_lock') return Promise.resolve({ data: true, error: null });
        if (name === 'claim_pending_notification_candidates') return Promise.resolve({ data: [candidate], error: null });
        if (name === 'persist_notification_candidate_resolution_with_lock') {
          return Promise.resolve({ data: null, error: { message: 'notification_cadence_conflict' } });
        }
        return Promise.resolve({ data: true, error: null });
      }),
      from: vi.fn().mockImplementation((table: string) => table === 'notification_candidates'
        ? { update: updateCandidates }
        : makeReadQuery({ data: [], error: null })),
    };

    const result = await executeCandidateResolverPipeline({ supabase: supabase as unknown as SupabaseClient });

    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('cadence_history_changed_retry_next_run');
    expect(result.retryCount).toBe(1);
    expect(updateCandidates).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', claimed_at: null }));
    expect(updateIn).toHaveBeenCalledWith('id', ['candidate-after-conflict']);
    expect(updateEq).toHaveBeenCalledWith('status', 'resolving');
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
