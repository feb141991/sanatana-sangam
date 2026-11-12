import type { createAdminClient } from '@/lib/supabase-admin';

/**
 * What "download your data" contains (privacy policy, "Your Choices and Controls").
 *
 * Every table that carries a reference to a person must be listed here as exported, handled by the route itself, or excluded
 * with a reason. `src/lib/user-data-export.test.ts` compares this file with the generated database types, so a new table that
 * holds user data fails the build until someone decides which of the three it is. Origin: the 2026-11-12 privacy audit found the
 * export read 10 of about 110 such tables, stopped at 1,000 rows per table and cut some history to 90 days, while the policy
 * promised "an export of your account data".
 */

export type UserExportSource = {
  table: string;
  /** Columns that point at the account holder. More than one means "any of them". */
  userColumns: string[];
  /** Stable order for paging. */
  orderBy: string[];
  /** Columns whose value is a secret or an access credential: kept out of the file and replaced with a marker. */
  redact?: string[];
};

export const REDACTED_MARKER = '[redacted: secret value]';

export const USER_EXPORT_SOURCES: UserExportSource[] = [
  { table: 'birth_profiles', userColumns: ['owner_id'], orderBy: ['id'], redact: ['session_token'] },
  { table: 'calendar_subscriptions', userColumns: ['user_id'], orderBy: ['created_at'], redact: ['token'] },
  { table: 'comment_upvotes', userColumns: ['user_id'], orderBy: ['created_at'] },
  { table: 'consent_events', userColumns: ['user_id'], orderBy: ['seq'] },
  { table: 'darshan_preferences', userColumns: ['user_id'], orderBy: ['created_at'] },
  { table: 'dharm_veer_responses', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'email_consent_events', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'event_rsvps', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'forum_replies', userColumns: ['author_id'], orderBy: ['id'] },
  { table: 'forum_threads', userColumns: ['author_id'], orderBy: ['id'] },
  { table: 'guided_path_progress', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'journal_entries', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'journal_reflections', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'karma_award_log', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'kul_events', userColumns: ['created_by'], orderBy: ['id'] },
  { table: 'kul_family_members', userColumns: ['created_by'], orderBy: ['id'] },
  { table: 'kul_members', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'kul_messages', userColumns: ['sender_id'], orderBy: ['id'] },
  { table: 'kul_tasks', userColumns: ['assigned_to'], orderBy: ['id'] },
  { table: 'kuls', userColumns: ['created_by'], orderBy: ['id'], redact: ['invite_code'] },
  { table: 'legal_acceptances', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'mandali_connections', userColumns: ['requester_id', 'recipient_id'], orderBy: ['id'] },
  { table: 'name_stories', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'nitya_karma_log', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'nitya_karma_streaks', userColumns: ['user_id'], orderBy: ['user_id'] },
  { table: 'notifications', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'pathshala_circle_members', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'pathshala_enrollments', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'pathshala_progress', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'pathshala_recordings', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'pathshala_study_circles', userColumns: ['created_by'], orderBy: ['id'] },
  { table: 'pathshala_user_badges', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'pathshala_user_state', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'pathshala_verse_mastery', userColumns: ['user_id'], orderBy: ['user_id'] },
  { table: 'post_comments', userColumns: ['author_id'], orderBy: ['id'] },
  { table: 'post_poll_votes', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'post_upvotes', userColumns: ['user_id'], orderBy: ['created_at'] },
  { table: 'posts', userColumns: ['author_id'], orderBy: ['id'] },
  { table: 'push_tokens', userColumns: ['user_id'], orderBy: ['id'], redact: ['token'] },
  { table: 'quiz_sessions', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'reading_progress', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'sadhana_events', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'sankalpa', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'sankalpa_checkins', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'sankalpa_reflections', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'sankalpas', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'sattvic_sessions', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'scripture_corrections', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'seva_log', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'seva_task_completions', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'thread_messages', userColumns: ['sender_id'], orderBy: ['id'] },
  { table: 'thread_participants', userColumns: ['user_id'], orderBy: ['user_id'] },
  { table: 'thread_reactions', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'thread_upvotes', userColumns: ['user_id'], orderBy: ['created_at'] },
  { table: 'tirtha_checkins', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'tirtha_place_media', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'tirtha_place_notes', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'tirtha_places', userColumns: ['created_by'], orderBy: ['id'] },
  { table: 'tirtha_reports', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'tirtha_reviews', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'tirtha_saves', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'tirtha_visits', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'user_blocked_profiles', userColumns: ['blocker_id'], orderBy: ['id'] },
  { table: 'user_challenge_progress', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'user_festival_quiz_progress', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'user_hidden_content', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'user_practice', userColumns: ['user_id'], orderBy: ['user_id'] },
  { table: 'user_warnings', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'vrat_observations', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'yatra_plans', userColumns: ['user_id'], orderBy: ['id'] },
  { table: 'account_deletion_notices', userColumns: ['user_id'], orderBy: ['user_id'] },
  { table: 'kul_family_link_invitations', userColumns: ['created_by', 'invited_user_id'], orderBy: ['id'], redact: ['token'] },
  { table: 'kul_invitations', userColumns: ['created_by'], orderBy: ['id'], redact: ['token'] },
];

/** Exported by the route itself with its own column choices (kept so the file's existing keys do not change). */
export const USER_EXPORT_ROUTE_TABLES = [
  'daily_sadhana',
  'user_mood_checkins',
  'recommendations',
  'mala_sessions',
  'quiz_responses',
  'karma_ledger',
  'native_product_analytics_daily',
  'native_startup_telemetry_summaries',
  'notification_taps',
] as const;

/** Tables with a user reference that are deliberately not in the file, each with the reason. */
export const USER_EXPORT_EXCLUDED: Record<string, string> = {
  apple_auth_tokens: 'a credential (encrypted Apple sign-in token), not information about you',
  email_security_devices: 'device fingerprints used only to protect against abuse',
  ai_chat_answer_cache: 'a short-lived cache of generated answers that expires on its own',
  ai_chat_usage: 'rate-limit counters',
  notification_brahma_reset_backup_20261112: 'a temporary rollback copy of one reminder switch, to be removed once the reset is confirmed; your current setting is in your profile',
  notification_cadence_events: 'internal scheduling log, no message content',
  notification_candidates: 'internal scheduling queue, no message content',
  notification_dispatch_events: 'internal delivery log, no message content',
  notification_deliveries: 'internal delivery receipts from the push providers',
  notification_resolver_events: 'internal scheduling log, no message content',
  notification_resolver_lock: 'a lock record used by the scheduler',
  notification_schedule: 'internal queue of reminders still to be sent',
  push_receipts_pending: 'internal queue of push receipts still to be checked',
  push_token_events: 'internal log of push-token changes',
  sanskara_claims: 'exported separately from Settings > Your Sanskara data, which is governed by its own consent',
  sanskara_records: 'exported separately from Settings > Your Sanskara data, which is governed by its own consent',
  calendar_profiles: 'staff reviewer column, not information about the account holder',
  dharm_veers: 'staff reviewer column, not information about the account holder',
  golden_fixtures: 'staff reviewer column, not information about the account holder',
  marketing_campaigns: 'staff-authored content, not information about the account holder',
  observance_artwork: 'staff reviewer column, not information about the account holder',
  observance_content_sources: 'staff reviewer column, not information about the account holder',
  observance_review_queue: 'staff reviewer column, not information about the account holder',
  observance_share_templates: 'staff reviewer column, not information about the account holder',
  observance_story_translations: 'staff reviewer column, not information about the account holder',
  observance_story_versions: 'staff reviewer column, not information about the account holder',
  social_posts: 'staff-authored marketing posts, not information about the account holder',
  social_publish_attempts: 'staff-authored marketing posts, not information about the account holder',
  source_references: 'staff-authored content, not information about the account holder',
  tradition_profiles: 'staff reviewer column, not information about the account holder',
};

export const EXPORT_PAGE_SIZE = 1000;
/** Per table. A table that reaches it is reported as incomplete, never silently cut. */
export const EXPORT_MAX_ROWS_PER_TABLE = 20_000;
export const EXPORT_CONCURRENCY = 4;

type Admin = ReturnType<typeof createAdminClient>;

export type ExportIncomplete = { table: string; reason: 'read_failed' | 'row_limit_reached' };
export type TableRead = { rows: Record<string, unknown>[]; incomplete: ExportIncomplete | null };

type ReadSpec = {
  table: string;
  userColumns: string[];
  orderBy: Array<string | { column: string; ascending: boolean }>;
  /** Defaults to every column. */
  select?: string;
  redact?: string[];
};

/** Reads every row for one account, a page at a time, in a stable order. A failure is reported, not hidden. */
export async function readAllRows(admin: Admin, spec: ReadSpec, userId: string): Promise<TableRead> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; from < EXPORT_MAX_ROWS_PER_TABLE; from += EXPORT_PAGE_SIZE) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = admin.from(spec.table as never).select(spec.select ?? '*');
    query = spec.userColumns.length > 1
      ? query.or(spec.userColumns.map((column) => `${column}.eq.${userId}`).join(','))
      : query.eq(spec.userColumns[0], userId);
    for (const order of spec.orderBy) {
      const { column, ascending } = typeof order === 'string' ? { column: order, ascending: true } : order;
      query = query.order(column, { ascending });
    }
    const { data, error } = await query.range(from, from + EXPORT_PAGE_SIZE - 1);
    if (error) return { rows: [], incomplete: { table: spec.table, reason: 'read_failed' } };
    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) {
      return { rows: redactRows(rows, spec.redact), incomplete: null };
    }
  }
  return { rows: redactRows(rows, spec.redact), incomplete: { table: spec.table, reason: 'row_limit_reached' } };
}

function redactRows(rows: Record<string, unknown>[], columns?: string[]): Record<string, unknown>[] {
  if (!columns?.length) return rows;
  return rows.map((row) => {
    const copy = { ...row };
    for (const column of columns) if (copy[column] !== null && copy[column] !== undefined) copy[column] = REDACTED_MARKER;
    return copy;
  });
}

/** Runs the reads a few at a time so one export cannot flood a busy database. */
export async function readExportSources(
  admin: Admin,
  userId: string,
  sources: UserExportSource[] = USER_EXPORT_SOURCES,
): Promise<{ data: Record<string, Record<string, unknown>[]>; incomplete: ExportIncomplete[]; tablesRead: number }> {
  const data: Record<string, Record<string, unknown>[]> = {};
  const incomplete: ExportIncomplete[] = [];
  let next = 0;
  async function worker() {
    while (next < sources.length) {
      const source = sources[next++];
      const result = await readAllRows(admin, source, userId);
      if (result.rows.length > 0) data[source.table] = result.rows;
      if (result.incomplete) incomplete.push(result.incomplete);
    }
  }
  await Promise.all(Array.from({ length: Math.min(EXPORT_CONCURRENCY, sources.length) }, worker));
  return { data, incomplete, tablesRead: sources.length };
}

/** A plain description of the file, written into it so a person can see what it is and is not. */
export function describeExport(sources: UserExportSource[], incomplete: ExportIncomplete[], tablesWithData: number) {
  return {
    scope: 'Everything we hold that is linked to your account, except the items under "not_included".',
    tables_checked: sources.length + USER_EXPORT_ROUTE_TABLES.length + 1,
    tables_with_data: tablesWithData,
    incomplete_tables: incomplete,
    redacted_columns: sources.flatMap((s) => (s.redact ?? []).map((column) => `${s.table}.${column}`)),
    not_included: {
      sanskara: 'Sanskara timelines are exported separately from Settings > Your Sanskara data.',
      uploaded_files: 'Photos and recordings you uploaded are stored as files and are not part of this JSON. Contact support to receive them.',
      other_people: 'Posts and messages by other people are not included, even where you replied to them.',
      internal_records: Object.entries(USER_EXPORT_EXCLUDED).map(([table, reason]) => ({ table, reason })),
    },
  };
}
