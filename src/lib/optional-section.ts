export type OptionalSectionStatus = 'ready' | 'timed_out' | 'failed';

export type OptionalSectionResult<T> = {
  value: T;
  status: OptionalSectionStatus;
  durationMs: number;
};

/**
 * Bounds non-critical response work without allowing a rejected enrichment
 * promise to fail the owning API response. The underlying task is observed so
 * a late rejection never becomes unhandled, even after the deadline wins.
 */
export async function settleOptionalSection<T>(
  task: PromiseLike<T>,
  timeoutMs: number,
  fallback: T,
): Promise<OptionalSectionResult<T>> {
  const startedAt = performance.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const observedTask = Promise.resolve(task).then(
    (value) => ({ value, status: 'ready' as const }),
    () => ({ value: fallback, status: 'failed' as const }),
  );

  try {
    const result = await Promise.race([
      observedTask,
      new Promise<{ value: T; status: 'timed_out' }>((resolve) => {
        timeout = setTimeout(() => resolve({ value: fallback, status: 'timed_out' }), timeoutMs);
      }),
    ]);
    return {
      ...result,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
