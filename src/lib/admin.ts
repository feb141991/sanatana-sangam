import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth';

// ── Service-role Supabase client (for admin DB operations) ────────────────────

export function createServiceRoleSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are not configured');
  }

  return createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ── Admin access guard (cookie-based, no Supabase auth) ───────────────────────

type AdminContext =
  | { response: NextResponse }
  | { username: string; supabase: ReturnType<typeof createServiceRoleSupabaseClient> };

export async function requireAdminAccess(): Promise<AdminContext> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? '';
  const session = await verifyAdminToken(token);

  if (!session) {
    return { response: NextResponse.json({ error: 'Admin authentication required' }, { status: 401 }) };
  }

  return {
    username: session.username,
    supabase: createServiceRoleSupabaseClient(),
  };
}
