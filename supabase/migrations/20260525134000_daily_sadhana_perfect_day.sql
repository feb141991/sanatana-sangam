-- Add perfect_day_bonus_given column to daily_sadhana to track if the 5-pillar bonus was awarded

ALTER TABLE public.daily_sadhana 
ADD COLUMN IF NOT EXISTS perfect_day_bonus_given boolean DEFAULT false;
