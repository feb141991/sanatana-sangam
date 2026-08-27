import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLocalStorageItem, writeLocalStorageItem } from '@/lib/safe-browser-storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('safe browser storage', () => {
  it('returns null when the localStorage property is blocked', () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new DOMException('Storage is unavailable', 'SecurityError');
      },
    });

    expect(() => readLocalStorageItem('preference')).not.toThrow();
    expect(readLocalStorageItem('preference')).toBeNull();
  });

  it('fails softly when reading or writing throws', () => {
    expect(readLocalStorageItem('preference', {
      getItem: () => { throw new Error('read blocked'); },
    })).toBeNull();

    expect(writeLocalStorageItem('preference', 'true', {
      setItem: () => { throw new Error('write blocked'); },
    })).toBe(false);
  });

  it('reads and writes when storage is available', () => {
    let value: string | null = null;
    const storage = {
      getItem: () => value,
      setItem: (_key: string, nextValue: string) => { value = nextValue; },
    };

    expect(writeLocalStorageItem('preference', 'true', storage)).toBe(true);
    expect(readLocalStorageItem('preference', storage)).toBe('true');
  });
});
