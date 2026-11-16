export type FeedbackCategory = 'suggestion' | 'issue' | 'content' | 'appreciation' | 'other';

export type ParsedFeedbackInput = {
  category: FeedbackCategory;
  message: string;
  rating: number | null;
  email: string | null;
  deviceInfo: Record<string, unknown> | null;
};

const VALID_CATEGORIES = new Set<FeedbackCategory>(['suggestion', 'issue', 'content', 'appreciation', 'other']);

export function parseFeedbackInput(raw: unknown): ParsedFeedbackInput | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const rawMessage = typeof obj.message === 'string' ? obj.message.trim() : '';
  if (!rawMessage || rawMessage.length < 3) return null;
  const message = rawMessage.slice(0, 2000);

  const rawCategory = typeof obj.category === 'string' ? obj.category.trim().toLowerCase() : 'other';
  const category: FeedbackCategory = VALID_CATEGORIES.has(rawCategory as FeedbackCategory)
    ? (rawCategory as FeedbackCategory)
    : 'other';

  let rating: number | null = null;
  if (typeof obj.rating === 'number' && Number.isFinite(obj.rating)) {
    const rounded = Math.round(obj.rating);
    if (rounded >= 1 && rounded <= 5) {
      rating = rounded;
    }
  }

  let email: string | null = null;
  if (typeof obj.email === 'string' && obj.email.trim()) {
    const trimmed = obj.email.trim();
    if (trimmed.length <= 200 && trimmed.includes('@')) {
      email = trimmed;
    }
  }

  let deviceInfo: Record<string, unknown> | null = null;
  if (typeof obj.deviceInfo === 'object' && obj.deviceInfo !== null && !Array.isArray(obj.deviceInfo)) {
    deviceInfo = obj.deviceInfo as Record<string, unknown>;
  }

  return {
    category,
    message,
    rating,
    email,
    deviceInfo,
  };
}
