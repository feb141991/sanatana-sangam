-- Destructive rollback: removes every morning card and its approval history. Images already uploaded to the
-- private social-post-drafts bucket (under morning/) are not removed by this script. Do not run after production
-- use without approval.
drop trigger if exists social_morning_cards_guard on public.social_morning_cards;
drop function if exists public.social_morning_cards_guard();
drop table if exists public.social_morning_cards;
