import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getApiUser: vi.fn(),
  assertNotBanned: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: mocks.getApiUser,
}));
vi.mock('@/lib/api-guards', () => ({ assertNotBanned: mocks.assertNotBanned }));

import { GET } from './route';

function makeSupabase(reminderEnabled: boolean | null, rejectProfileRead = false) {
  const sankalpaSingle = vi.fn().mockResolvedValue({
    data: { id: 'vow-1', text: 'Keep a daily practice', target_days: 21 },
    error: null,
  });
  const sankalpaLimit = vi.fn().mockReturnValue({ single: sankalpaSingle });
  const sankalpaOrder = vi.fn().mockReturnValue({ limit: sankalpaLimit });
  const sankalpaGte = vi.fn().mockReturnValue({ order: sankalpaOrder });
  const sankalpaEqStatus = vi.fn().mockReturnValue({ gte: sankalpaGte });
  const sankalpaEqUser = vi.fn().mockReturnValue({ eq: sankalpaEqStatus });
  const sankalpaSelect = vi.fn().mockReturnValue({ eq: sankalpaEqUser });

  const profileMaybeSingle = vi.fn().mockResolvedValue({
    data: reminderEnabled === null ? null : { wants_sankalpa_midpoint_reminders: reminderEnabled },
    error: null,
  });
  if (rejectProfileRead) profileMaybeSingle.mockRejectedValue(new Error('temporary profile read failure'));
  const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
  const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });

  return {
    from: vi.fn((table: string) => table === 'sankalpas'
      ? { select: sankalpaSelect }
      : { select: profileSelect }),
  };
}

describe('GET /api/sankalpa notification preference contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the midpoint reminder preference alongside the active vow', async () => {
    const supabase = makeSupabase(false);
    mocks.getApiUser.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null, supabase });

    const response = await GET(new NextRequest('https://shoonaya.com/api/sankalpa'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.sankalpa.id).toBe('vow-1');
    expect(payload.wantsSankalpaMidpointReminders).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('fails closed for the contextual prompt when the profile preference cannot be read', async () => {
    const supabase = makeSupabase(null);
    mocks.getApiUser.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null, supabase });

    const response = await GET(new NextRequest('https://shoonaya.com/api/sankalpa'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.wantsSankalpaMidpointReminders).toBeNull();
  });

  it('keeps the Sankalpa screen usable if the additive preference read rejects', async () => {
    const supabase = makeSupabase(null, true);
    mocks.getApiUser.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null, supabase });

    const response = await GET(new NextRequest('https://shoonaya.com/api/sankalpa'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.sankalpa.id).toBe('vow-1');
    expect(payload.wantsSankalpaMidpointReminders).toBeNull();
  });
});
