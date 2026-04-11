import type { AppDataRuntime } from '@/lib/api/runtime';
import { getAppDataRuntime } from '@/lib/api/runtime';

export function selectRuntimeAdapter<T extends object>(
  implementations: Record<AppDataRuntime, T>
): T {
  return implementations[getAppDataRuntime()];
}
