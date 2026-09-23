import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// mandali-data-server.ts imports 'server-only' and stands up real Supabase
// admin clients, so importing it directly here would need a much larger
// mock harness than exists for this file today. This is a structural
// source check instead -- verified non-vacuous by confirming it fails
// against the pre-fix source (see reliability plan item 7 commit).
describe('ensureTodaysMandaliPrompt is off the feed critical path', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/mandali-data-server.ts'),
    'utf8'
  );

  it('is imported from next/server', () => {
    expect(src).toMatch(/import \{ after \} from 'next\/server';/);
  });

  it('is never directly awaited by either feed-loading call site', () => {
    expect(src).not.toMatch(/await ensureTodaysMandaliPrompt\(/);
  });

  it('is scheduled via after() at both loadMandaliDataForUser and loadMandaliFeedPage call sites', () => {
    const matches = src.match(/after\(\(\) => ensureTodaysMandaliPrompt\(mandaliId\)\);/g) ?? [];
    expect(matches.length).toBe(2);
  });
});
