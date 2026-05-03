-- ─── Quiz Responses Migration ──────────────────────────────────────────────────
-- Tracks user performance in daily and practice quizzes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    question text NOT NULL,
    chosen_index integer NOT NULL,
    correct_index integer NOT NULL,
    is_correct boolean NOT NULL,
    tradition text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see/insert their own responses
CREATE POLICY "Users can view own quiz responses" ON public.quiz_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz responses" ON public.quiz_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_date ON public.quiz_responses(user_id, date);
