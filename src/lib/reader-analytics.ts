const READER_EVENTS = [
  'reader_opened',
  'language_toggled',
  'transliteration_toggled',
  'tts_requested',
  'explain_requested',
  'content_shared',
  'content_copied',
] as const;

const STRING_CONTEXT_FIELDS = [
  'content_type',
  'source',
  'tradition',
  'language',
] as const;

const BOOLEAN_CONTEXT_FIELDS = [
  'has_transliteration',
  'has_meaning',
] as const;

export type ReaderAnalyticsEvent = (typeof READER_EVENTS)[number];
export type ReaderAnalyticsContext = Record<string, string | boolean>;

const READER_EVENT_SET = new Set<string>(READER_EVENTS);
const MAX_CONTEXT_STRING_LENGTH = 160;

export function parseReaderAnalyticsEvent(value: unknown): ReaderAnalyticsEvent | null {
  return typeof value === 'string' && READER_EVENT_SET.has(value)
    ? value as ReaderAnalyticsEvent
    : null;
}

export function sanitizeReaderAnalyticsContext(value: unknown): ReaderAnalyticsContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const input = value as Record<string, unknown>;
  const context: ReaderAnalyticsContext = {};

  for (const field of STRING_CONTEXT_FIELDS) {
    const rawValue = input[field];
    if (typeof rawValue === 'string') {
      const normalizedValue = rawValue.trim().slice(0, MAX_CONTEXT_STRING_LENGTH);
      if (normalizedValue) context[field] = normalizedValue;
    }
  }

  for (const field of BOOLEAN_CONTEXT_FIELDS) {
    if (typeof input[field] === 'boolean') {
      context[field] = input[field];
    }
  }

  return context;
}
