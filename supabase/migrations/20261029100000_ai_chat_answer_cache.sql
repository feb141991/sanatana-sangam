-- Dharma Mitra answers a person's question the same way every time they ask it.
--
-- /api/ai/chat remembers, per person, the answer it gave to a question and returns that answer when the same person
-- asks the same thing again (see src/lib/ai/chat-answer-cache.ts for exactly what "the same thing" means). The
-- question and context are represented by a SHA-256 cache key, not retained as plaintext. The answer text is
-- stored and may repeat details the person supplied in the question or conversation.
--
--   * One row per (person, question). The first answer stored wins; a second writer cannot replace it, which is what
--     keeps two simultaneous requests from giving two different answers.
--   * Rows expire after 14 days (expires_at). The route removes a person's expired rows when it writes a new one,
--     and the daily purge below removes the rest, so a person who stops asking leaves nothing behind.
--   * Removed with the account (ON DELETE CASCADE from auth.users, as ai_chat_usage is).
--   * Reached only by the route, through the service role. Row level security is forced and no policy exists, so the
--     public API key and a signed-in person's token cannot read or write it.
--
-- Not applied by this file's author. Reversal: supabase/rollbacks/20261029100000_ai_chat_answer_cache_rollback.sql.
-- Test: supabase/tests/ai_chat_answer_cache.test.sql.
begin;

create table public.ai_chat_answer_cache (
  user_id uuid not null references auth.users(id) on delete cascade,
  cache_key text not null check (cache_key ~ '^[0-9a-f]{64}$'),
  answer text not null check (length(answer) between 1 and 8000),
  provider text check (provider is null or length(provider) <= 64),
  model text check (model is null or length(model) <= 128),
  prompt_fingerprint text not null check (length(prompt_fingerprint) between 1 and 128),
  corpus_version text not null check (length(corpus_version) between 1 and 64),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (user_id, cache_key),
  constraint ai_chat_answer_cache_expires_after_created check (expires_at > created_at)
);

comment on table public.ai_chat_answer_cache is
  'Per-person remembered Dharma Mitra answers so the same question gets the same answer. Stores answer text (which may echo user-provided details) and a SHA-256 key for the question/context, not the question in plaintext. Service role only. Expires after 14 days.';

create index ai_chat_answer_cache_expires_at_idx on public.ai_chat_answer_cache (expires_at);

alter table public.ai_chat_answer_cache enable row level security;
alter table public.ai_chat_answer_cache force row level security;

revoke all on table public.ai_chat_answer_cache from public, anon, authenticated;
grant all on table public.ai_chat_answer_cache to service_role;

select cron.schedule(
  'purge-ai-chat-answer-cache-daily',
  '47 3 * * *',
  $$delete from public.ai_chat_answer_cache where expires_at < now()$$
);

commit;
