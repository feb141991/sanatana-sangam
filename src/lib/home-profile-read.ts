export const HOME_PROFILE_COLUMNS = 'full_name, username, avatar_url, cover_url, city, country, latitude, longitude, timezone, tradition, sampradaya, ishta_devata, app_language, active_symbol_id, karma_points, nitya_rhythm_mode, shloka_streak, last_shloka_date, calendar_scope, calendar_profile, wants_festival_reminders, wants_vrat_reminders, wants_tithi_reminders';

type QueryResult<T> = {
  data: T | null;
  error: { code?: string; message?: string } | null;
  status?: number;
};
type Attempt = { stage: 'read' | 'retry' | 'repair' | 'refetch'; status: string; code: string | null; durationMs: number };
export type HomeProfileReadResult<T> = {
  profile: T | null;
  status: 'ready' | 'missing' | 'failed' | 'timed_out';
  attempts: Attempt[];
};

/** Profile is required context, not optional enrichment. Never manufacture a
 * different tradition/location when its read is unavailable. */
export async function readHomeProfile<T>(deps: {
  read: (signal: AbortSignal) => PromiseLike<QueryResult<T>>;
  repair: () => PromiseLike<unknown>;
  budgetMs?: number;
  attemptMs?: number;
}): Promise<HomeProfileReadResult<T>> {
  const deadline = performance.now() + (deps.budgetMs ?? 6500);
  const attempts: Attempt[] = [];
  const attemptMs = deps.attemptMs ?? 4000;
  const timeLeft = () => Math.max(0, deadline - performance.now());

  async function read(stage: 'read' | 'retry' | 'refetch') {
    const started = performance.now();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    const task = Promise.resolve().then(() => deps.read(controller.signal)).catch(() => ({
      data: null, error: { code: 'TRANSPORT_ERROR' }, status: 0,
    }));
    const result = await Promise.race([
      task,
      new Promise<QueryResult<T>>((resolve) => {
        timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
          resolve({ data: null, error: { code: 'READ_TIMEOUT' }, status: 0 });
        }, Math.min(attemptMs, timeLeft()));
      }),
    ]).finally(() => { if (timer) clearTimeout(timer); });
    const status: HomeProfileReadResult<T>['status'] = timedOut ? 'timed_out' : result.error ? 'failed' : result.data ? 'ready' : 'missing';
    attempts.push({ stage, status, code: result.error?.code ?? null, durationMs: Math.round(performance.now() - started) });
    return { ...result, httpStatus: result.status ?? 0, status };
  }

  let result = await read('read');
  const retryable = result.status === 'timed_out' || Boolean(result.error && (
    (result.httpStatus === 0 && !result.error.code) || result.httpStatus >= 500 ||
    result.error.code === 'TRANSPORT_ERROR' || result.error.code?.startsWith('08') || result.error.code === '57014'
  ));
  if (retryable && timeLeft() > 0) {
    result = await read('retry');
  }

  if (result.status === 'missing' && timeLeft() > 0) {
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const repaired = await Promise.race([
      Promise.resolve().then(deps.repair).catch(() => null),
      new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), Math.min(2000, timeLeft())); }),
    ]).finally(() => { if (timer) clearTimeout(timer); });
    attempts.push({ stage: 'repair', status: repaired ? 'ready' : 'failed', code: null, durationMs: Math.round(performance.now() - started) });
    if (repaired && timeLeft() > 0) result = await read('refetch');
  }

  return { profile: result.status === 'ready' ? result.data : null, status: result.status, attempts };
}
