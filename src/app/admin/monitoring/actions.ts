'use server';

import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export async function resolveContentReport(reportId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? '';
  const admin = await verifyAdminToken(token);
  if (!admin) {
    throw new Error('Forbidden');
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('content_reports')
    .update({ status: 'reviewed' })
    .eq('id', reportId)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to resolve report', error);
    throw new Error('Database error');
  }

  revalidatePath('/admin/monitoring');
}
