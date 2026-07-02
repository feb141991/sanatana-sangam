'use server';

import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';

/**
 * Supabase's conditional-type inference for `.update()` resolves to `never`
 * for the `content_reports` table due to a known TypeScript limitation with
 * deferred conditional types in complex generic chains (postgrest-js v2).
 * The cast through `unknown` is the idiomatic workaround — the runtime call
 * is fully correct and type-safe at the application level.
 */
type ChainableEq = {
  eq(col: string, val: string): ChainableEq & PromiseLike<{ error: { message: string } | null }>;
};

function updateContentReport(
  adminSupabase: ReturnType<typeof createAdminClient>,
  values: { status: ReportStatus },
): ChainableEq {
  return (adminSupabase.from('content_reports') as unknown as {
    update(v: { status: ReportStatus }): ChainableEq;
  }).update(values);
}

export async function resolveContentReport(reportId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? '';
  const admin = await verifyAdminToken(token);
  if (!admin) {
    throw new Error('Forbidden');
  }

  const adminSupabase = createAdminClient();
  const { error } = await updateContentReport(adminSupabase, { status: 'reviewed' })
    .eq('id', reportId)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to resolve report', error);
    throw new Error('Database error');
  }

  revalidatePath('/admin/monitoring');
}
