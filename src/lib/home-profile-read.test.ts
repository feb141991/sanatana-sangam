import { afterEach, describe, expect, it, vi } from 'vitest';
import { readHomeProfile } from './home-profile-read';

const profile = { tradition: 'hindu', timezone: 'Europe/London', latitude: 51.5 };
const ready = { data: profile, error: null, status: 200 };
const missing = { data: null, error: null, status: 200 };

describe('required Home profile recovery', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps valid profile context without retrying or repairing', async () => {
    const read = vi.fn().mockResolvedValue(ready);
    const repair = vi.fn();
    expect((await readHomeProfile({ read, repair })).profile).toEqual(profile);
    expect(read).toHaveBeenCalledTimes(1);
    expect(repair).not.toHaveBeenCalled();
  });

  it('retries a transient provider failure once', async () => {
    const read = vi.fn().mockResolvedValueOnce({ data: null, error: { code: '08006' }, status: 503 }).mockResolvedValue(ready);
    const repair = vi.fn();
    const result = await readHomeProfile({ read, repair });
    expect(result.profile).toEqual(profile);
    expect(result.attempts.map(a => a.stage)).toEqual(['read', 'retry']);
    expect(repair).not.toHaveBeenCalled();
  });

  it.each(['42703', '42501'])('does not retry or provision on permanent schema/permission error %s', async code => {
    const read = vi.fn().mockResolvedValue({ data: null, error: { code, message: 'private provider detail' }, status: 400 });
    const repair = vi.fn();
    const result = await readHomeProfile({ read, repair });
    expect(result.profile).toBeNull();
    expect(result.status).toBe('failed');
    expect(read).toHaveBeenCalledTimes(1);
    expect(repair).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain('private provider detail');
  });

  it('refetches after repairing a confirmed missing row', async () => {
    const read = vi.fn().mockResolvedValueOnce(missing).mockResolvedValue(ready);
    const repair = vi.fn().mockResolvedValue({ onboardingCompleted: false });
    const result = await readHomeProfile({ read, repair });
    expect(result.profile).toEqual(profile);
    expect(result.attempts.map(a => a.stage)).toEqual(['read', 'repair', 'refetch']);
    expect(repair).toHaveBeenCalledTimes(1);
  });

  it('never invents a profile when repair fails or refetch still finds no row', async () => {
    for (const repaired of [null, { onboardingCompleted: false }]) {
      const result = await readHomeProfile({ read: vi.fn().mockResolvedValue(missing), repair: vi.fn().mockResolvedValue(repaired) });
      expect(result.profile).toBeNull();
      expect(result.status).toBe('missing');
    }
  });

  it('aborts timed-out reads within one shared budget without provisioning', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    const signals: AbortSignal[] = [];
    const read = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<never>(() => {});
    });
    const repair = vi.fn();
    const pending = readHomeProfile({ read, repair, budgetMs: 65, attemptMs: 40 });
    await vi.advanceTimersByTimeAsync(65);
    const result = await pending;
    expect(result.status).toBe('timed_out');
    expect(result.profile).toBeNull();
    expect(read).toHaveBeenCalledTimes(2);
    expect(signals.every(signal => signal.aborted)).toBe(true);
    expect(result.attempts.reduce((total, a) => total + a.durationMs, 0)).toBeLessThanOrEqual(65);
    expect(repair).not.toHaveBeenCalled();
  });

  it('observes transport exceptions and retries once', async () => {
    const read = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue(ready);
    const result = await readHomeProfile({ read, repair: vi.fn() });
    expect(result.profile).toEqual(profile);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('stops after a second transient failure without attempting profile repair', async () => {
    const read = vi.fn().mockResolvedValue({ data: null, error: { code: '08006' }, status: 503 });
    const repair = vi.fn();
    const result = await readHomeProfile({ read, repair });
    expect(result.profile).toBeNull();
    expect(result.status).toBe('failed');
    expect(read).toHaveBeenCalledTimes(2);
    expect(repair).not.toHaveBeenCalled();
  });

  it('bounds a stalled repair and does not pretend it returned a profile', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    const read = vi.fn().mockResolvedValue(missing);
    const pending = readHomeProfile({ read, repair: () => new Promise<never>(() => {}), budgetMs: 50 });
    await vi.advanceTimersByTimeAsync(50);
    const result = await pending;
    expect(result.profile).toBeNull();
    expect(read).toHaveBeenCalledTimes(1);
    expect(result.attempts.at(-1)?.stage).toBe('repair');
    expect(result.attempts.at(-1)?.status).toBe('failed');
  });
});
