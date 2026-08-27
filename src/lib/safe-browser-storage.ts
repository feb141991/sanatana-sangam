type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    // Safari private/restricted contexts can throw while accessing the property.
    return null;
  }
}

export function readLocalStorageItem(
  key: string,
  storage: ReadableStorage | null = getLocalStorage()
): string | null {
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorageItem(
  key: string,
  value: string,
  storage: WritableStorage | null = getLocalStorage()
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
