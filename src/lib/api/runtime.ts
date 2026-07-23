export type AppDataRuntime = 'live' | 'mock';

const DEFAULT_RUNTIME: AppDataRuntime = 'live';

export function getAppDataRuntime(): AppDataRuntime {
  const configured = process.env.NEXT_PUBLIC_APP_DATA_RUNTIME?.trim().toLowerCase();
  if (configured === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_APP_DATA_RUNTIME=mock is not allowed in production.');
    }
    return 'mock';
  }
  if (configured === 'live') return configured;
  return DEFAULT_RUNTIME;
}

export function prefersMockData() {
  return getAppDataRuntime() === 'mock';
}
