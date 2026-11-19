-- Rollback: Support Tickets & Help System Schema
-- File: supabase/rollbacks/20261119183000_support_tickets_system.rollback.sql
-- Description: Reverts support_tickets and support_ticket_messages tables.

DROP TABLE IF EXISTS public.support_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
