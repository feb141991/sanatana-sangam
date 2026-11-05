import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { canUseOfflineFixtureCache, readFixtureRows } from './fixture-loader';

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;
const savedRow = { slug: 'saved-copy' };
const liveRow = { slug: 'live' };
const failingRead = () => Promise.resolve({ data: null, error: { message: 'Error 522' } });
const workingRead = () => Promise.resolve({ data: [liveRow], error: null });

describe('canUseOfflineFixtureCache', () => {
  it('needs an explicit opt-in and is refused in CI whatever is set', () => {
    expect(canUseOfflineFixtureCache(env({}))).toBe(false);
    expect(canUseOfflineFixtureCache(env({ DHARMA_FIXTURES_OFFLINE: '1' }))).toBe(true);
    expect(canUseOfflineFixtureCache(env({ DHARMA_FIXTURES_OFFLINE: 'true' }))).toBe(false);
    expect(canUseOfflineFixtureCache(env({ CI: 'true', DHARMA_FIXTURES_OFFLINE: '1' }))).toBe(false);
    expect(canUseOfflineFixtureCache(env({ CI: '1', DHARMA_FIXTURES_OFFLINE: '1' }))).toBe(false);
  });
});

describe('readFixtureRows', () => {
  let dir: string;
  let cacheFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'fixture-cache-'));
    cacheFile = join(dir, 'rows.cache.json');
    vi.stubEnv('CI', '');
    vi.stubEnv('DHARMA_FIXTURES_OFFLINE', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
  });

  it('fails in CI on a failed read, even with the opt-in set and a saved copy present', async () => {
    writeFileSync(cacheFile, JSON.stringify([savedRow]));
    vi.stubEnv('CI', 'true');
    vi.stubEnv('DHARMA_FIXTURES_OFFLINE', '1');
    await expect(readFixtureRows('rows', cacheFile, failingRead)).rejects.toThrow('Error 522');
  });

  it('fails locally on a failed read without the opt-in', async () => {
    writeFileSync(cacheFile, JSON.stringify([savedRow]));
    await expect(readFixtureRows('rows', cacheFile, failingRead)).rejects.toThrow('Error 522');
  });

  it('uses the saved copy only with the local opt-in, and says the run verifies nothing', async () => {
    writeFileSync(cacheFile, JSON.stringify([savedRow]));
    vi.stubEnv('DHARMA_FIXTURES_OFFLINE', '1');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(readFixtureRows('rows', cacheFile, failingRead)).resolves.toEqual([savedRow]);
    expect(warn.mock.calls[0][0]).toContain('does not verify any date');
    warn.mockRestore();
  });

  it('still fails with the opt-in when there is no saved copy', async () => {
    vi.stubEnv('DHARMA_FIXTURES_OFFLINE', '1');
    await expect(readFixtureRows('rows', cacheFile, failingRead)).rejects.toThrow('Error 522');
  });

  it('returns live rows and writes nothing on a normal run', async () => {
    await expect(readFixtureRows('rows', cacheFile, workingRead)).resolves.toEqual([liveRow]);
    expect(existsSync(cacheFile)).toBe(false);
  });

  it('refreshes the saved copy only for an opted-in local run', async () => {
    vi.stubEnv('DHARMA_FIXTURES_OFFLINE', '1');
    await readFixtureRows('rows', cacheFile, workingRead);
    expect(JSON.parse(readFileSync(cacheFile, 'utf-8'))).toEqual([liveRow]);
  });
});
