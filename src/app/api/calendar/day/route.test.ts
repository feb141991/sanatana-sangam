import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

// The date gate runs before anything else, so impossible days must be refused here instead of
// reaching the calendar engine (shape-only validation accepted "2025-02-31").
const get = (date: string) => GET(new NextRequest(`http://localhost:3000/api/calendar/day?date=${encodeURIComponent(date)}`));

describe('GET /api/calendar/day: date parameter', () => {
  it.each(['2025-02-31', '2023-02-29', '2025-04-31', '2025-13-45', '2025-00-10', '18081991', '2025-2-3', 'tomorrow'])(
    'rejects %s with a 400 before doing any work',
    async (date) => {
      const res = await get(date);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/date/i);
    },
  );
});
