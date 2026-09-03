-- 20260902150000_notification_templates.sql
-- Editable notification copy and placeholders for admin management

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id TEXT PRIMARY KEY,
  routine TEXT NOT NULL,
  tradition TEXT NOT NULL DEFAULT 'all',
  category TEXT NOT NULL DEFAULT 'daily_routine',
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  available_placeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_routine_tradition 
  ON public.notification_templates(routine, tradition);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Admins can view and edit
CREATE POLICY "Admins read notification templates"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins update notification templates"
  ON public.notification_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true)
    )
  );
