import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ enqueue: vi.fn().mockResolvedValue({ queued: 1, ignored: 0 }) }));
vi.mock('@/lib/ai/providers/inference', () => ({ generateWithProvider: vi.fn().mockResolvedValue({ text: 'Weekly reflection fixture' }) }));
vi.mock('@/lib/notification-schedule-queue', () => ({ enqueueNotificationSchedule: mocks.enqueue }));
vi.mock('@/lib/sacred-time', () => ({ resolveTimeZone: () => 'Asia/Kolkata', buildSpiritualDateRange: () => ['2026-10-25'],
  localSpiritualDate: () => '2026-10-25', getNextLocalHourUtc: () => ({ sendAt: new Date('2026-10-25T04:30:00Z'), localDateIso: '2026-10-25' }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: (table: string) => ({ select: () => table === 'profiles'
  ? Promise.resolve({ data: [{ id: 'viewer', tradition: 'hindu', timezone: 'Asia/Kolkata' }], error: null })
  : { in: () => ({ gte: () => ({ lte: () => Promise.resolve({ data: [{ user_id: 'viewer', date: '2026-10-25', japa_done: true }], error: null }) }) }) },
}) }) }));
import { GET } from '../route';
afterEach(() => vi.unstubAllEnvs());
it('queues weekly reflection to existing Progress screen', async () => {
  vi.stubEnv('CRON_SECRET', 'test-only'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.com'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only');
  const result = await GET(new Request('https://example.com/api/cron/weekly-summary', { headers: { authorization: 'Bearer test-only' } }));
  expect(result.status).toBe(200);
  expect(mocks.enqueue).toHaveBeenCalledWith(expect.anything(), [expect.objectContaining({ metadata: expect.objectContaining({ action_url: '/my-progress' }) })]);
});
