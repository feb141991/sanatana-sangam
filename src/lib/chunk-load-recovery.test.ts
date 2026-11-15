import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHUNK_RELOAD_KEY,
  CHUNK_RELOAD_WINDOW_MS,
  claimChunkReload,
  isChunkLoadError,
  recoverFromChunkLoadError,
  type ReloadGuardStorage,
} from './chunk-load-recovery';

const ROOT = process.cwd();

function memoryStorage(initial: Record<string, string> = {}): ReloadGuardStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('isChunkLoadError', () => {
  it('recognises the error a stale page raises after a deploy', () => {
    const named = new Error('boom');
    named.name = 'ChunkLoadError';
    expect(isChunkLoadError(named)).toBe(true);
    expect(isChunkLoadError(new Error('Loading chunk 40450 failed.\n(error: https://www.shoonaya.com/_next/static/chunks/40450.js)'))).toBe(true);
    expect(isChunkLoadError(new Error('Loading CSS chunk 12 failed.'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/y.js'))).toBe(true);
    expect(isChunkLoadError('Loading chunk app/layout failed')).toBe(true);
    expect(isChunkLoadError({ name: 'ChunkLoadError' })).toBe(true);
    expect(isChunkLoadError({ message: 'Loading chunk 7 failed.' })).toBe(true);
  });

  it('is false for every other error, including other things that merely mention a chunk', () => {
    expect(isChunkLoadError(new TypeError('x is undefined'))).toBe(false);
    expect(isChunkLoadError(new Error('Failed to load audio chunk'))).toBe(false);
    expect(isChunkLoadError(new Error('Network request failed'))).toBe(false);
    expect(isChunkLoadError('Script error.')).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(42)).toBe(false);
    expect(isChunkLoadError({})).toBe(false);
  });
});

describe('claimChunkReload (the loop guard)', () => {
  it('allows the first reload and records when', () => {
    const storage = memoryStorage();
    expect(claimChunkReload(storage, 1_000_000)).toBe(true);
    expect(storage.data[CHUNK_RELOAD_KEY]).toBe('1000000');
  });

  it('refuses a second reload inside the window and allows one after it', () => {
    const storage = memoryStorage();
    expect(claimChunkReload(storage, 1_000_000)).toBe(true);
    expect(claimChunkReload(storage, 1_000_000 + CHUNK_RELOAD_WINDOW_MS - 1)).toBe(false);
    expect(claimChunkReload(storage, 1_000_000 + CHUNK_RELOAD_WINDOW_MS)).toBe(true);
  });

  it('does not reload when storage is missing or throws (it could not prove it is not a loop)', () => {
    expect(claimChunkReload(null, 1)).toBe(false);
    const broken: ReloadGuardStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(claimChunkReload(broken, 1)).toBe(false);
    const writeFails: ReloadGuardStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(claimChunkReload(writeFails, 1)).toBe(false);
  });

  it('treats a garbled stored value as no record, and a clock that moved back as recent', () => {
    expect(claimChunkReload(memoryStorage({ [CHUNK_RELOAD_KEY]: 'not a number' }), 5_000_000)).toBe(true);
    expect(claimChunkReload(memoryStorage({ [CHUNK_RELOAD_KEY]: '5000000' }), 4_990_000)).toBe(false);
  });
});

describe('recoverFromChunkLoadError', () => {
  const chunkError = new Error('Loading chunk 40450 failed.');

  it('reloads once for a chunk error and tells the caller to stop', () => {
    const storage = memoryStorage();
    let reloads = 0;
    expect(recoverFromChunkLoadError(chunkError, { storage, now: 10, reload: () => { reloads += 1; } })).toBe(true);
    expect(reloads).toBe(1);
  });

  it('on a repeat inside the window it does not reload, so the caller reports it as a real failure', () => {
    const storage = memoryStorage();
    let reloads = 0;
    const reload = () => { reloads += 1; };
    expect(recoverFromChunkLoadError(chunkError, { storage, now: 10, reload })).toBe(true);
    expect(recoverFromChunkLoadError(chunkError, { storage, now: 20, reload })).toBe(false);
    expect(reloads).toBe(1);
  });

  it('leaves every other error alone: no reload, no storage write', () => {
    const storage = memoryStorage();
    let reloads = 0;
    expect(recoverFromChunkLoadError(new TypeError('x is undefined'), { storage, reload: () => { reloads += 1; } })).toBe(false);
    expect(reloads).toBe(0);
    expect(storage.data).toEqual({});
  });
});

describe('how it is wired', () => {
  const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

  it.each([
    ['src/app/global-error.tsx', 'reportClientError({ source: \'react_root\''],
    ['src/app/(main)/home/error.tsx', 'reportClientError({ source: \'react_home\''],
  ])('%s tries the reload before it reports the crash, and offers a reload button for a stale build', (path, reportCall) => {
    const source = read(path);
    expect(source).toContain('recoverFromChunkLoadError(error)');
    expect(source.indexOf('recoverFromChunkLoadError(error)')).toBeLessThan(source.indexOf(reportCall));
    expect(source).toContain('window.location.reload()');
  });

  it('the global window handlers reload before reporting, for both errors and unhandled rejections', () => {
    const source = read('src/components/monitoring/ClientErrorReporter.tsx');
    expect(source).toContain('recoverFromChunkLoadError(event.error ?? event.message)');
    expect(source).toContain('recoverFromChunkLoadError(event.reason)');
    expect(source.indexOf('recoverFromChunkLoadError(event.error')).toBeLessThan(source.indexOf("source: 'window_error'"));
    expect(source.indexOf('recoverFromChunkLoadError(event.reason)')).toBeLessThan(source.indexOf("source: 'unhandled_rejection'"));
  });
});
