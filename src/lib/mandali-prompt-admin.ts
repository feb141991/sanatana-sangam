import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

type MandaliPromptDatabase = {
  public: {
    Tables: Pick<Database['public']['Tables'], 'mandali_prompts' | 'posts'>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/**
 * Narrow typed client for the newly added prompt tables. The project's
 * hand-curated full Database interface has a known Supabase `.from()`
 * inference failure for newly appended tables; constraining the schema here
 * keeps prompt writes typed without falling back to `any` or `as never`.
 */
export function createMandaliPromptAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are not configured');
  }

  return createClient<MandaliPromptDatabase>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
