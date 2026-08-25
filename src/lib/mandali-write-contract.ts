export const MANDALI_POST_TYPES = ['update', 'event', 'question', 'announcement'] as const;

export type MandaliPostType = (typeof MANDALI_POST_TYPES)[number];

export type MandaliPostInput = {
  content: string;
  postType: MandaliPostType;
  eventDate: string | null;
  eventLocation: string | null;
};

function optionalText(value: unknown, maximum: number) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) return undefined;
  return normalized;
}

export function parseMandaliPostInput(value: unknown): MandaliPostInput | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const postType = typeof body.postType === 'string' && MANDALI_POST_TYPES.includes(body.postType as MandaliPostType)
    ? body.postType as MandaliPostType
    : null;
  const eventDate = optionalText(body.eventDate, 64);
  const eventLocation = optionalText(body.eventLocation, 180);
  if (!content || content.length > 2_000 || !postType || eventDate === undefined || eventLocation === undefined) return null;
  if (postType === 'event' && eventDate && Number.isNaN(Date.parse(eventDate))) return null;
  return { content, postType, eventDate, eventLocation };
}

export function parseMandaliCommentInput(value: unknown): { postId: string; body: string; parentId: string | null } | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const postId = typeof input.postId === 'string' ? input.postId.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  const parentId = optionalText(input.parentId, 128);
  if (!postId || !body || body.length > 1_000 || parentId === undefined) return null;
  return { postId, body, parentId };
}
