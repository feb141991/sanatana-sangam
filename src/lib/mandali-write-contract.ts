export const MANDALI_POST_TYPES = ['update', 'event', 'question', 'announcement'] as const;

export type MandaliPostType = (typeof MANDALI_POST_TYPES)[number];

export type MandaliPostInput = {
  content: string;
  postType: MandaliPostType;
  eventDate: string | null;
  eventLocation: string | null;
  clientOperationId: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalText(value: unknown, maximum: number) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) return undefined;
  return normalized;
}

// Shared by posts and comments: an omitted key means "no idempotency
// requested" (null, valid) -- web callers that haven't adopted the outbox
// keep working unchanged. A present-but-malformed value fails closed
// (undefined) so a caller can't silently degrade to non-idempotent by
// sending garbage.
function optionalClientOperationId(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !UUID_RE.test(value)) return undefined;
  return value;
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
  const clientOperationId = optionalClientOperationId(body.clientOperationId);
  if (!content || content.length > 2_000 || !postType || eventDate === undefined || eventLocation === undefined || clientOperationId === undefined) return null;
  if (postType === 'event' && eventDate && Number.isNaN(Date.parse(eventDate))) return null;
  return { content, postType, eventDate, eventLocation, clientOperationId };
}

export function parseMandaliCommentInput(value: unknown): { postId: string; body: string; parentId: string | null; clientOperationId: string | null } | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const postId = typeof input.postId === 'string' ? input.postId.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  const parentId = optionalText(input.parentId, 128);
  const clientOperationId = optionalClientOperationId(input.clientOperationId);
  if (!postId || !body || body.length > 1_000 || parentId === undefined || clientOperationId === undefined) return null;
  return { postId, body, parentId, clientOperationId };
}

export function parseMandaliCommentEditInput(value: unknown): { commentId: string; body: string } | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const commentId = typeof input.commentId === 'string' ? input.commentId.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!commentId || !body || body.length > 1_000) return null;
  return { commentId, body };
}

export function parseMandaliCommentDeleteInput(value: unknown): { commentId: string } | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const commentId = typeof input.commentId === 'string' ? input.commentId.trim() : '';
  if (!commentId) return null;
  return { commentId };
}
