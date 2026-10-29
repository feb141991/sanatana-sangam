-- Reverses 20261029100000_ai_chat_answer_cache.sql. Remembered answers are discarded; Dharma Mitra then simply
-- generates every answer fresh (the route treats a missing table as "nothing remembered"). Safe at any time.
begin;
select cron.unschedule('purge-ai-chat-answer-cache-daily')
where exists (select 1 from cron.job where jobname = 'purge-ai-chat-answer-cache-daily');
drop table if exists public.ai_chat_answer_cache;
commit;
