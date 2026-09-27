import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  profiles: [] as Array<Record<string, unknown>>,
  selectedColumns: '',
}));

process.env.CRON_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table ${table}`);
      return {
        select: (columns: string) => {
          mocks.selectedColumns = columns;
          return {
            or: async () => ({ data: mocks.profiles, error: null }),
          };
        },
      };
    },
  }),
}));

vi.mock('@/lib/notification-safety', () => ({
  getNotificationSafetyState: () => ({ isDryRun: true, skipDelivery: false, disabledReason: null }),
  buildNotificationSafetyResponse: (_type: string, _state: unknown, data: unknown) => data,
}));

vi.mock('@/lib/observance-notification-source', () => ({
  buildObservanceActionPath: () => '/vrat/nirjala-ekadashi',
  buildObservancePreviewRow: () => ({ name: 'Nirjala Ekadashi' }),
  buildOccurrenceNotificationKey: () => 'vrat:test',
  fetchReviewedObservancesForNotifications: async () => ({ observances: [], error: null }),
  filterGeneralOccurrenceBackedVrats: () => [{
    id: 'occurrence-1',
    name: 'Nirjala Ekadashi',
    emoji: '🌾',
    date: '2026-10-02',
    type: 'vrat',
    slug: 'nirjala-ekadashi',
    description: 'A reviewed observance.',
  }],
  filterWomenFocusedVrats: () => [],
}));

vi.mock('@/lib/calendar/observance-series-eligibility', () => ({
  fetchIncompleteSeriesOccurrenceIds: async () => new Set(),
}));

vi.mock('@/lib/sacred-time', () => ({
  canSendInLocalWindow: () => true,
  getLocalDateIso: () => '2026-10-01',
  isoDateDiff: () => 1,
  resolveTimeZone: (value: string | null | undefined) => value ?? 'UTC',
}));

const { GET } = await import('./route');

function makeRequest() {
  return new Request('https://example.com/api/cron/vrat-reminder?dryRun=true', {
    headers: { authorization: 'Bearer test-secret' },
  });
}

describe('legacy Vrat reminder preference', () => {
  beforeEach(() => {
    mocks.profiles = [];
    mocks.selectedColumns = '';
    delete process.env.OBSERVANCE_PIPELINE_MODE;
    delete process.env.OBSERVANCE_PIPELINE_MODE_VRAT;
  });

  it('does not send Vrat reminders when Vrat is off even if festival reminders are on', async () => {
    mocks.profiles = [{
      id: 'user-1',
      tradition: 'hindu',
      gender_context: 'general',
      timezone: 'UTC',
      wants_festival_reminders: true,
      wants_vrat_reminders: false,
      notification_quiet_hours_start: null,
      notification_quiet_hours_end: null,
    }];

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.message).toBe('No vrat reminders due today');
    expect(mocks.selectedColumns).toContain('wants_vrat_reminders');
    expect(mocks.selectedColumns).not.toContain('wants_festival_reminders');
  });

  it('keeps Vrat reminders eligible when Vrat is on even if festival reminders are off', async () => {
    mocks.profiles = [{
      id: 'user-1',
      tradition: 'hindu',
      gender_context: 'general',
      timezone: 'UTC',
      wants_festival_reminders: false,
      wants_vrat_reminders: true,
      notification_quiet_hours_start: null,
      notification_quiet_hours_end: null,
    }];

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.wouldSendCount).toBe(1);
  });
});
