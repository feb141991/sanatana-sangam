export function normalizeWaitlistEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

export function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

export function isValidIanaTimezone(value: string | null): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function csvCell(value: string | number | null | undefined): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export type EarlyAccessSortOrder = 'newest' | 'oldest' | 'founding_asc' | 'founding_desc';
export type EarlyAccessPlatformFilter = 'all' | 'android' | 'ios' | 'web';
export type EarlyAccessWaitlistFilter = {
  query: string;
  tradition: string;
  platform: EarlyAccessPlatformFilter;
  sort: EarlyAccessSortOrder;
};

export function parseEarlyAccessFilters(searchParams: URLSearchParams): EarlyAccessWaitlistFilter {
  const rawQuery = (searchParams.get('query') ?? '').trim().slice(0, 100);
  const query = rawQuery.replace(/[^\p{L}\p{N}@.+\s'-]/gu, '').replace(/\s+/g, ' ').trim();
  const rawTradition = searchParams.get('tradition') ?? 'all';
  const tradition = ['all', 'hindu', 'sikh', 'buddhist', 'jain', 'universal'].includes(rawTradition) ? rawTradition : 'all';
  const rawPlatform = searchParams.get('device') ?? 'all';
  const platform: EarlyAccessPlatformFilter = ['all', 'android', 'ios', 'web'].includes(rawPlatform)
    ? rawPlatform as EarlyAccessPlatformFilter
    : 'all';
  const rawSort = searchParams.get('sort') ?? 'newest';
  const sort: EarlyAccessSortOrder = ['newest', 'oldest', 'founding_asc', 'founding_desc'].includes(rawSort)
    ? rawSort as EarlyAccessSortOrder
    : 'newest';
  return { query, tradition, platform, sort };
}
