import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', () => ({ getApiUser: (...args: unknown[]) => getApiUser(...args) }));

import { GET } from './route';

function createSupabase(options?: {
  banned?: boolean;
  profileError?: string;
  progressError?: string;
}) {
  return {
    from(table: string) {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: options?.profileError
                  ? null
                  : { tradition: 'jain', app_language: 'en', timezone: 'Asia/Kolkata', is_banned: options?.banned ?? false },
                error: options?.profileError ? { message: options.profileError } : null,
              }),
            }),
          }),
        };
      }

      if (table === 'guided_path_progress') {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({
                data: options?.progressError
                  ? null
                  : [{ path_id: 'jain-ethics', current_lesson: 2, completed_lessons: [0, 1], status: 'active' }],
                error: options?.progressError ? { message: options.progressError } : null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe('GET /api/pathshala/context', () => {
  beforeEach(() => getApiUser.mockReset());

  it('returns 401 when the bearer session cannot be verified', async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error('Unauthorized'), supabase: null });

    const response = await GET(new NextRequest('http://localhost/api/pathshala/context'));

    expect(response.status).toBe(401);
  });

  it('returns the lightweight private context with timing metadata', async () => {
    getApiUser.mockResolvedValue({
      user: { id: 'user-1' },
      error: null,
      supabase: createSupabase(),
    });

    const response = await GET(new NextRequest('http://localhost/api/pathshala/context'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Server-Timing')).toContain('auth;dur=');
    expect(payload.profile).toEqual({ tradition: 'jain' });
    expect(payload.enrollments).toEqual([
      { pathId: 'jain-ethics', currentLesson: 2, completedLessons: [0, 1], status: 'active' },
    ]);
    expect(payload.sacredText.original).toBeTruthy();
    expect(payload.spiritualDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('preserves the banned-account guard', async () => {
    getApiUser.mockResolvedValue({
      user: { id: 'user-2' },
      error: null,
      supabase: createSupabase({ banned: true }),
    });

    const response = await GET(new NextRequest('http://localhost/api/pathshala/context'));

    expect(response.status).toBe(403);
  });

  it('fails closed when profile or progress data cannot be read', async () => {
    getApiUser.mockResolvedValue({
      user: { id: 'user-3' },
      error: null,
      supabase: createSupabase({ progressError: 'timeout' }),
    });

    const response = await GET(new NextRequest('http://localhost/api/pathshala/context'));

    expect(response.status).toBe(500);
  });
});
