-- Rollback Migration for 20260805195000_create_calendar_and_tradition_profiles.sql
-- Drops the foreign keys, calendar_profiles table, and tradition_profiles table.

-- 1. Drop foreign keys from observance_occurrences
ALTER TABLE public.observance_occurrences
  DROP CONSTRAINT IF EXISTS fk_observance_occurrences_calendar_profile;

ALTER TABLE public.observance_occurrences
  DROP CONSTRAINT IF EXISTS fk_observance_occurrences_spiritual_tradition;

-- 2. Drop the tables
DROP TABLE IF EXISTS public.calendar_profiles;
DROP TABLE IF EXISTS public.tradition_profiles;
