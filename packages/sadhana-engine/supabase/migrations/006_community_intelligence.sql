-- ============================================================
-- Migration 006: Community Intelligence Views
-- Phase 3 — builds on existing kuls/kul_members/kul_tasks/kul_events
-- No new tables — only views and indexes over existing structure.
-- SAFE TO RE-RUN — all CREATE OR REPLACE / IF NOT EXISTS.
-- ============================================================

-- ── 1. Who practiced today in each kul ──
-- Joins kul_members → mala_sessions for today's date.
-- Used by ai-kul-nudge to know who in your kul already practiced.

CREATE OR REPLACE VIEW kul_practice_today
WITH (security_invoker = true)
AS
SELECT
  km.kul_id,
  km.user_id,
  km.role,
  COALESCE(SUM(ms.count), 0)          AS japa_count_today,
  COUNT(ms.id)                         AS sessions_today,
  (COUNT(ms.id) > 0)                   AS practiced_today
FROM kul_members km
LEFT JOIN mala_sessions ms
  ON  ms.user_id     = km.user_id
  AND ms.completed_at::date = CURRENT_DATE
GROUP BY km.kul_id, km.user_id, km.role;


-- ── 2. Kul weekly practice stats ──
-- Aggregates the past 7 days of mala_sessions per kul.
-- Used by ai-kul-summary for the weekly digest.

CREATE OR REPLACE VIEW kul_weekly_stats
WITH (security_invoker = true)
AS
SELECT
  km.kul_id,
  k.name                                        AS kul_name,
  k.avatar_emoji,
  COUNT(DISTINCT km.user_id)                    AS total_members,
  COUNT(DISTINCT ms.user_id)                    AS active_members_7d,
  COALESCE(SUM(ms.count), 0)                   AS total_japa_7d,
  COALESCE(AVG(ms.duration_seconds), 0)::INT   AS avg_session_duration_s,
  MAX(up.current_streak)                        AS top_streak,
  MAX(up.consistency_score)                     AS top_consistency
FROM kul_members km
JOIN kuls k ON k.id = km.kul_id
LEFT JOIN mala_sessions ms
  ON  ms.user_id     = km.user_id
  AND ms.completed_at >= NOW() - INTERVAL '7 days'
LEFT JOIN user_practice up
  ON  up.user_id = km.user_id
GROUP BY km.kul_id, k.name, k.avatar_emoji;


-- ── 3. Member practice profile within kul context ──
-- Combines user_practice + kul_members + recent mala_sessions.
-- Used by ai-kul-task when guardian asks for task suggestions.

CREATE OR REPLACE VIEW kul_member_profiles
WITH (security_invoker = true)
AS
SELECT
  km.kul_id,
  km.user_id,
  km.role,
  km.joined_at,
  up.tradition,
  up.preferred_deity,
  up.primary_path,
  up.content_depth,
  up.current_streak,
  up.consistency_score,
  up.preferred_time,
  up.avg_session_duration_s,
  up.favorite_texts,
  up.re_engagement_style,
  -- Recent japa summary
  COALESCE(recent.session_count, 0) AS sessions_last_7d,
  COALESCE(recent.total_japa, 0)    AS japa_last_7d,
  recent.last_mantra
FROM kul_members km
LEFT JOIN user_practice up ON up.user_id = km.user_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)          AS session_count,
    SUM(ms.count)     AS total_japa,
    MAX(ms.mantra)    AS last_mantra
  FROM mala_sessions ms
  WHERE ms.user_id    = km.user_id
    AND ms.completed_at >= NOW() - INTERVAL '7 days'
) recent ON true;


-- ── 4. Pending kul tasks (for dashboard + digest) ──

CREATE OR REPLACE VIEW kul_pending_tasks
WITH (security_invoker = true)
AS
SELECT
  kt.id,
  kt.kul_id,
  kt.assigned_to,
  kt.assigned_by,
  kt.title,
  kt.task_type,
  kt.content_ref,
  kt.due_date,
  kt.score,
  kt.completed,
  kt.guardian_note,
  kt.created_at,
  CASE
    WHEN kt.due_date < CURRENT_DATE AND NOT kt.completed THEN 'overdue'
    WHEN kt.due_date = CURRENT_DATE                      THEN 'due_today'
    ELSE 'upcoming'
  END AS urgency
FROM kul_tasks kt
WHERE kt.completed = false
ORDER BY kt.due_date ASC NULLS LAST;


-- ── 5. Indexes to support view performance ──

-- mala_sessions: fast lookup by user + date (used heavily by views above)
CREATE INDEX IF NOT EXISTS idx_mala_sessions_user_date
  ON mala_sessions (user_id, completed_at DESC);

-- kul_members: fast lookup by kul or user
CREATE INDEX IF NOT EXISTS idx_kul_members_kul
  ON kul_members (kul_id);

CREATE INDEX IF NOT EXISTS idx_kul_members_user
  ON kul_members (user_id);

-- kul_tasks: pending tasks per kul
CREATE INDEX IF NOT EXISTS idx_kul_tasks_kul_pending
  ON kul_tasks (kul_id, completed, due_date)
  WHERE completed = false;

-- kul_events: lookup by kul + date (no partial predicate — CURRENT_DATE is not immutable)
-- "upcoming" filtering happens at query time in the WHERE clause
CREATE INDEX IF NOT EXISTS idx_kul_events_upcoming
  ON kul_events (kul_id, event_date);
