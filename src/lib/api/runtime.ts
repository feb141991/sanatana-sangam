export type AppDataRuntime = 'live' | 'mock';

const DEFAULT_RUNTIME: AppDataRuntime = 'mock';

export function getAppDataRuntime(): AppDataRuntime {
  const configured = process.env.NEXT_PUBLIC_APP_DATA_RUNTIME?.trim().toLowerCase();
  if (configured === 'live' || configured === 'mock') return configured;
  return DEFAULT_RUNTIME;
}

export function prefersMockData() {
  return getAppDataRuntime() === 'mock';
}
