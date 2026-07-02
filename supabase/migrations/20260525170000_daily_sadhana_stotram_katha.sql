-- Add stotram and katha completion tracking to daily_sadhana
ALTER TABLE public.daily_sadhana
  ADD COLUMN IF NOT EXISTS stotram_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS katha_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS stotram_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS katha_count integer DEFAULT 0;
