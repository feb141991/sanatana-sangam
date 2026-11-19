-- Migration: Support Tickets & Help System Schema
-- File: supabase/migrations/20261119183000_support_tickets_system.sql
-- Description: Creates support_tickets and support_ticket_messages tables
-- with RLS policies, indexing, and foreign key cascades.

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    -- SHA-256 of the access code shown once to the seeker. Knowing a ticket number or an e-mail address is never enough to read a thread.
    access_token_hash TEXT NOT NULL,
    -- Deleting the account deletes its tickets (privacy audit 2026-11-12: nothing personal outlives the account).
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seeker_name TEXT NOT NULL,
    seeker_email TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'calendar_panchang',
        'sadhana_japa',
        'account_auth',
        'app_bug',
        'spiritual_content',
        'billing_donation',
        'general'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'low',
        'medium',
        'high',
        'urgent'
    )),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open',
        'in_progress',
        'waiting_on_seeker',
        'resolved',
        'closed'
    )),
    subject TEXT NOT NULL CHECK (char_length(subject) <= 200),
    description TEXT NOT NULL CHECK (char_length(description) <= 4000),
    rag_deflection_attempted BOOLEAN NOT NULL DEFAULT true,
    rag_solution_offered TEXT,
    rag_deflection_feedback TEXT CHECK (rag_deflection_feedback IN ('helpful', 'unresolved', 'skipped', NULL)),
    client_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(client_metadata) <= 4096),
    assigned_admin TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create support_ticket_messages table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    -- The ticket owner, on messages the owner may see (never on internal notes), so the account export finds the whole thread.
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('seeker', 'admin', 'system_agent')),
    sender_id TEXT,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) <= 4000),
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for rapid lookups and queue filtering
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON public.support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_user_id ON public.support_ticket_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id, created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for support_tickets
CREATE POLICY "Seekers can view their own tickets" ON public.support_tickets
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Admins can manage all support tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
        )
    );

-- 6. RLS Policies for support_ticket_messages
CREATE POLICY "Seekers can view non-internal messages on their tickets" ON public.support_ticket_messages
    FOR SELECT USING (
        is_internal_note = FALSE AND
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE support_tickets.id = support_ticket_messages.ticket_id
              AND support_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all support ticket messages" ON public.support_ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
        )
    );

-- 7. Writes come only from the API (service role), which sets status, priority and every other column itself; no INSERT policy exists for
--    the anon or authenticated keys. Seekers may only read their own ticket and its non-internal messages (policies above).

-- 8. Retention: a finished ticket (resolved or closed) is deleted 12 months after its last update, guest tickets included.
SELECT cron.schedule(
    'purge-support-tickets-daily',
    '17 3 * * *',
    $$DELETE FROM public.support_tickets WHERE status IN ('resolved', 'closed') AND updated_at < now() - interval '365 days'$$
);
