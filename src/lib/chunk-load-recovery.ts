/**
 * A visitor whose page was loaded before a deploy asks for a JavaScript chunk that the new deployment no
 * longer serves: webpack throws "Loading chunk 40450 failed" (a ChunkLoadError). Retrying in the same page
 * cannot work, because the page still carries the old build's file names; only a full reload fetches the new
 * ones. This module recognises that error and reloads once, with a guard so a chunk that is really missing
 * can never put a visitor in a reload loop.
 */

/** sessionStorage key holding the time (ms) of this tab's last automatic reload for a chunk error. */
export const CHUNK_RELOAD_KEY = 'sh_chunk_reload_at';
/** One automatic reload per tab per minute. A second failure inside the window is a real problem, not a deploy. */
export const CHUNK_RELOAD_WINDOW_MS = 60_000;

const CHUNK_FAILURE =
  /Loading (?:CSS )?chunk [\w./-]+ failed|Failed to fetch dynamically imported module|Failed to load chunk\b/i;

/** True for the errors a stale page raises when a chunk is gone. Anything else (including other "chunk" errors) is false. */
export function isChunkLoadError(error: unknown): boolean {
  if (error === null || error === undefined) return false;
  if (typeof error === 'string') return CHUNK_FAILURE.test(error);
  if (typeof error !== 'object') return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'ChunkLoadError') return true;
  return typeof message === 'string' && CHUNK_FAILURE.test(message);
}

export interface ReloadGuardStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Records a reload and returns true only if this tab has not reloaded for a chunk error inside the window.
 * No usable storage means no way to prove it is not a loop, so it returns false: showing the error page is
 * safer than reloading forever.
 */
export function claimChunkReload(storage: ReloadGuardStorage | null, now: number): boolean {
  if (!storage) return false;
  try {
    const last = Number(storage.getItem(CHUNK_RELOAD_KEY));
    if (Number.isFinite(last) && last > 0 && Math.abs(now - last) < CHUNK_RELOAD_WINDOW_MS) return false;
    storage.setItem(CHUNK_RELOAD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

export interface ChunkRecoveryDeps {
  storage?: ReloadGuardStorage | null;
  now?: number;
  reload?: () => void;
}

function tabStorage(): ReloadGuardStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * If `error` is a chunk-load failure and this tab has not just reloaded for one, reloads the page and returns
 * true (the caller should stop: nothing is wrong that a reload will not fix, so it is not reported as a crash).
 * Otherwise returns false and the caller carries on as before, so a persistent failure is still reported.
 */
export function recoverFromChunkLoadError(error: unknown, deps: ChunkRecoveryDeps = {}): boolean {
  if (!isChunkLoadError(error)) return false;
  const storage = deps.storage !== undefined ? deps.storage : tabStorage();
  if (!claimChunkReload(storage, deps.now ?? Date.now())) return false;
  (deps.reload ?? (() => window.location.reload()))();
  return true;
}
