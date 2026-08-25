-- Rollback for 20260825111348_create_legal_acceptances.sql
-- Destroys all recorded acceptance history. Emergency use only.

DROP TABLE IF EXISTS public.legal_acceptances;
