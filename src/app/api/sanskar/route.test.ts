import { describe, expect, it } from 'vitest';
import { POST as schedulePost } from './schedule/route';
import { POST as suggestPost } from './suggest/route';

describe('retired legacy sanskara endpoints', () => {
  it('returns 410 Gone for schedule and suggest routes', async () => {
    const [scheduleRes, suggestRes] = await Promise.all([
      schedulePost(),
      suggestPost(),
    ]);

    expect(scheduleRes.status).toBe(410);
    await expect(scheduleRes.json()).resolves.toMatchObject({
      code: 'ROUTE_DEPRECATED',
    });

    expect(suggestRes.status).toBe(410);
    await expect(suggestRes.json()).resolves.toMatchObject({
      code: 'ROUTE_DEPRECATED',
    });
  });
});
