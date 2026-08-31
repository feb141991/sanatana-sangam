import type { Database, Profile } from '@/types/database';

export const REPORT_REASON_OPTIONS = [
  { value: 'abusive', label: 'Harassment or abuse' },
  { value: 'intolerant', label: 'Hate or intolerance' },
  { value: 'misleading', label: 'Misleading spiritual claim' },
  { value: 'spam', label: 'Spam or promotion' },
  { value: 'privacy', label: 'Private or sensitive information' },
] as const;

export const SAFETY_CONTENT_LABELS = {
  mandali_post: 'Mandali post',
  ai_chat_response: 'AI response',
} as const;

export const AI_REPORT_REASON_OPTIONS = [
  { value: 'incorrect',              label: 'Factually incorrect' },
  { value: 'harmful',                label: 'Harmful or dangerous' },
  { value: 'religiously_inaccurate', label: 'Religiously inaccurate' },
  { value: 'offensive',              label: 'Offensive content' },
  { value: 'other',                  label: 'Other' },
] as const;
export type AiReportReason = (typeof AI_REPORT_REASON_OPTIONS)[number]['value'];

export type ReportReason = (typeof REPORT_REASON_OPTIONS)[number]['value'];
export type SafetyContentType = keyof typeof SAFETY_CONTENT_LABELS;

export type ContentReport = Database['public']['Tables']['content_reports']['Row'];
export type BlockedProfileRow = Database['public']['Tables']['user_blocked_profiles']['Row'];
export type MutedProfileRow = Database['public']['Tables']['user_muted_profiles']['Row'];
export type HiddenContentRow = Database['public']['Tables']['user_hidden_content']['Row'];

export type SafetyProfileSummary = Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'>;
export type HiddenContentSummary = HiddenContentRow & {
  title: string;
  subtitle: string;
};

export type UserSafetyState = {
  blockedByViewerIds: Set<string>;
  blockedViewerByIds: Set<string>;
  mutedProfileIds: Set<string>;
  hiddenContentKeys: Set<string>;
  excludedAuthorIds: Set<string>;
  hiddenRows: HiddenContentRow[];
};

function safeRows<T>(rows: T[] | null | undefined) {
  return rows ?? [];
}

function trimPreview(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return fallback;
  return normalized.length > 92 ? `${normalized.slice(0, 89)}...` : normalized;
}

export function getHiddenContentKey(contentType: SafetyContentType, contentId: string) {
  return `${contentType}:${contentId}`;
}

export function filterAuthoredItems<T extends { id: string; author_id: string }>(
  items: T[],
  contentType: SafetyContentType,
  state: UserSafetyState | null
) {
  if (!state) return items;

  return items.filter((item) => (
    !state.hiddenContentKeys.has(getHiddenContentKey(contentType, item.id)) &&
    !state.excludedAuthorIds.has(item.author_id)
  ));
}

export function filterProfileRows<T extends { id: string }>(items: T[], state: UserSafetyState | null) {
  if (!state) return items;
  return items.filter((item) => !state.excludedAuthorIds.has(item.id));
}

export async function getUserSafetyState(supabase: any, userId: string): Promise<UserSafetyState> {
  const [{ data: blockRows }, { data: muteRows }, { data: hiddenRows }] = await Promise.all([
    // Scoped to rows involving this user in either direction -- the
    // previous unfiltered select() read every block relationship in the
    // table on every call and filtered in application memory.
    supabase
      .from('user_blocked_profiles')
      .select('blocker_id, blocked_user_id')
      .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`),
    supabase
      .from('user_muted_profiles')
      .select('muter_id, muted_user_id')
      .eq('muter_id', userId),
    supabase
      .from('user_hidden_content')
      .select('id, user_id, content_type, content_id, created_at')
      .eq('user_id', userId),
  ]);

  const blockedByViewerIds = new Set(
    safeRows(blockRows)
      .filter((row: any) => row.blocker_id === userId)
      .map((row: any) => row.blocked_user_id)
  );

  const blockedViewerByIds = new Set(
    safeRows(blockRows)
      .filter((row: any) => row.blocked_user_id === userId)
      .map((row: any) => row.blocker_id)
  );

  const mutedProfileIds = new Set(
    safeRows(muteRows)
      .filter((row: any) => row.muter_id === userId)
      .map((row: any) => row.muted_user_id)
  );

  const normalizedHiddenRows = safeRows(hiddenRows) as HiddenContentRow[];
  const hiddenContentKeys = new Set(
    normalizedHiddenRows.map((row) => getHiddenContentKey(row.content_type as SafetyContentType, row.content_id))
  );

  return {
    blockedByViewerIds,
    blockedViewerByIds,
    mutedProfileIds,
    hiddenContentKeys,
    excludedAuthorIds: new Set([
      ...blockedByViewerIds,
      ...blockedViewerByIds,
      ...mutedProfileIds,
    ]),
    hiddenRows: normalizedHiddenRows,
  };
}

export async function getUserSafetyDashboardData(
  supabase: any,
  userId: string,
  state?: UserSafetyState
): Promise<{
  blockedProfiles: SafetyProfileSummary[];
  mutedProfiles: SafetyProfileSummary[];
  hiddenItems: HiddenContentSummary[];
}> {
  const resolvedState = state ?? await getUserSafetyState(supabase, userId);
  const profileIds = Array.from(new Set([
    ...resolvedState.blockedByViewerIds,
    ...resolvedState.mutedProfileIds,
  ]));

  const hiddenPostIds = resolvedState.hiddenRows
    .filter((row) => row.content_type === 'mandali_post')
    .map((row) => row.content_id);

  const [
    { data: safetyProfiles },
    { data: hiddenPosts },
  ] = await Promise.all([
    profileIds.length
      ? supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', profileIds)
      : Promise.resolve({ data: [] }),
    hiddenPostIds.length
      ? supabase
          .from('posts')
          .select('id, content')
          .in('id', hiddenPostIds)
      : Promise.resolve({ data: [] }),
  ]);

  const safeProfileRows = safeRows(safetyProfiles) as Array<{ id: string; username: string; avatar_url: string | null }>;
  const profileMap = new Map(
    safeProfileRows.map((profile) => [profile.id, {
      ...profile,
      full_name: profile.username,
    } satisfies SafetyProfileSummary])
  );

  const hiddenPreviewMap = new Map<string, { title: string; subtitle: string }>();

  safeRows(hiddenPosts).forEach((post: any) => {
    hiddenPreviewMap.set(getHiddenContentKey('mandali_post', post.id), {
      title: trimPreview(post.content, 'Hidden Mandali post'),
      subtitle: SAFETY_CONTENT_LABELS.mandali_post,
    });
  });

  const blockedProfiles = Array.from(resolvedState.blockedByViewerIds)
    .map((id) => profileMap.get(id))
    .filter(Boolean) as SafetyProfileSummary[];

  const mutedProfiles = Array.from(resolvedState.mutedProfileIds)
    .map((id) => profileMap.get(id))
    .filter(Boolean) as SafetyProfileSummary[];

  const hiddenItems = resolvedState.hiddenRows.map((row) => {
    const preview = hiddenPreviewMap.get(getHiddenContentKey(row.content_type as SafetyContentType, row.content_id));
    return {
      ...row,
      title: preview?.title ?? `Hidden ${SAFETY_CONTENT_LABELS[row.content_type as SafetyContentType].toLowerCase()}`,
      subtitle: preview?.subtitle ?? SAFETY_CONTENT_LABELS[row.content_type as SafetyContentType],
    };
  });

  return {
    blockedProfiles,
    mutedProfiles,
    hiddenItems,
  };
}
