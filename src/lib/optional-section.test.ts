import { describe, expect, it } from 'vitest';

import { settleOptionalSection } from './optional-section';

describe('settleOptionalSection', () => {
  it('returns successful optional work', async () => {
    const result = await settleOptionalSection(Promise.resolve(['calendar']), 50, [] as string[]);
    expect(result.value).toEqual(['calendar']);
    expect(result.status).toBe('ready');
  });

  it('fails soft when optional work rejects', async () => {
    const result = await settleOptionalSection(Promise.reject(new Error('optional failure')), 50, [] as string[]);
    expect(result.value).toEqual([]);
    expect(result.status).toBe('failed');
  });

  it('returns within its deadline and observes a later rejection', async () => {
    const lateFailure = new Promise<string[]>((_, reject) => {
      setTimeout(() => reject(new Error('late failure')), 30);
    });
    const result = await settleOptionalSection(lateFailure, 5, []);
    expect(result.value).toEqual([]);
    expect(result.status).toBe('timed_out');
    expect(result.durationMs).toBeLessThan(25);
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
});
