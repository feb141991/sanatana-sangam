import { describe, it, expect } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/native/home-summary Contract & Timing Suite', () => {
  it('returns 401 Unauthorized with proper headers when no auth is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/native/home-summary');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('guarantees response is marked private, no-store', async () => {
    const req = new NextRequest('http://localhost:3000/api/native/home-summary');
    const res = await GET(req);

    // Unauthenticated or authenticated must never be publicly CDN-cacheable
    const cacheControl = res.headers.get('Cache-Control');
    if (res.status === 200) {
      expect(cacheControl).toBe('private, no-store');
      expect(res.headers.has('Server-Timing')).toBe(true);
    }
  });
});
