import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '../route';
import { NextRequest } from 'next/server';
import { getApiUser } from '@/lib/api-auth';

vi.mock('@/lib/api-auth', () => ({
  getApiUser: vi.fn(),
  getApiAuthFailureResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  ),
}));

describe('push/preferences route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getApiUser).mockResolvedValueOnce({
      user: null,
      error: new Error('Unauthorized'),
      supabase: null,
    } as any);

    const req = new NextRequest('https://shoonaya.com/api/push/preferences');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns preferences for authenticated user via GET', async () => {
    const mockProfile = {
      dharm_veer_reminder_enabled: true,
      quiz_reminder_enabled: true,
      quiz_reminder_time: '12:00',
    };

    vi.mocked(getApiUser).mockResolvedValueOnce({
      user: { id: 'user-1' },
      error: null,
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
            }),
          }),
        }),
      },
    } as any);

    const req = new NextRequest('https://shoonaya.com/api/push/preferences');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.preferences).toEqual(mockProfile);
  });

  it('updates dharm_veer_reminder_enabled and quiz preferences via PATCH', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    vi.mocked(getApiUser).mockResolvedValueOnce({
      user: { id: 'user-1' },
      error: null,
      supabase: {
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      },
    } as any);

    const req = new NextRequest('https://shoonaya.com/api/push/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        dharm_veer_reminder_enabled: false,
        quiz_reminder_enabled: true,
        quiz_reminder_time: '15:30',
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      dharm_veer_reminder_enabled: false,
      quiz_reminder_enabled: true,
      quiz_reminder_time: '15:30',
    });
  });
});
