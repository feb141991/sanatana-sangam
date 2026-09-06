import { describe, expect, it } from 'vitest';
import { ServerTimingCollector } from './server-timing';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('ServerTimingCollector', () => {
  it('produces a valid "name;dur=X;desc=Y" header from measured stages, plus a trailing total', async () => {
    const timings = new ServerTimingCollector();
    await timings.measure('auth', 'Authentication', () => wait(5));
    await timings.measure('query', 'Main Query', () => wait(5));

    const header = timings.toHeaderValue();
    expect(header).toMatch(/^auth;dur=\d+(\.\d+)?;desc="Authentication", query;dur=\d+(\.\d+)?;desc="Main Query", total;dur=\d+(\.\d+)?;desc="Total"$/);
  });

  it('measure() returns the wrapped function\'s result unchanged', async () => {
    const timings = new ServerTimingCollector();
    const result = await timings.measure('stage', 'desc', () => ({ ok: true, value: 42 }));
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('measure() records timing even when the wrapped function throws, and still rethrows', async () => {
    const timings = new ServerTimingCollector();
    await expect(
      timings.measure('failing_stage', 'desc', () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    // The failed stage's timing was still recorded (finally-block semantics),
    // not silently dropped, so a slow-then-failing stage is still visible.
    expect(timings.toHeaderValue()).toContain('failing_stage;dur=');
  });

  it('record() supports manually-timed synchronous work alongside measure()', async () => {
    const timings = new ServerTimingCollector();
    timings.record('sync_stage', 12.345, 'Sync Work');
    await timings.measure('async_stage', 'Async Work', () => wait(1));

    const header = timings.toHeaderValue();
    expect(header).toContain('sync_stage;dur=12.35;desc="Sync Work"');
    expect(header).toContain('async_stage;dur=');
  });

  it('omits desc from a stage that was not given one, but keeps it on the trailing total', () => {
    const timings = new ServerTimingCollector();
    timings.record('bare_stage', 1);
    expect(timings.toHeaderValue()).toMatch(/^bare_stage;dur=1, total;dur=\d+(\.\d+)?;desc="Total"$/);
  });

  it('receipt() exposes total and per-stage timings as plain data, independent of the header format', () => {
    const timings = new ServerTimingCollector();
    timings.record('a', 10, 'A');
    timings.record('b', 20);
    const receipt = timings.receipt();
    expect(receipt.stages).toEqual([
      { name: 'a', dur: 10, desc: 'A' },
      { name: 'b', dur: 20, desc: undefined },
    ]);
    expect(receipt.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('totalDurationMs measures wall-clock time since construction, not the sum of recorded stages', async () => {
    const timings = new ServerTimingCollector();
    timings.record('understated_stage', 0);
    await wait(5);
    // Wall-clock total must reflect the actual elapsed time, even though
    // the only recorded stage claims 0ms -- a caller reading total alone
    // must not be misled into thinking the whole request was free.
    expect(timings.totalDurationMs()).toBeGreaterThan(0);
  });
});
