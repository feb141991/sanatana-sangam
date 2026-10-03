import { redirect } from 'next/navigation';
import { existsSync } from 'fs';
import { join } from 'path';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { buildDeletionPreview } from '@/lib/account-deletion-preview';
import DeleteAccountClient from './DeleteAccountClient';

export default async function DeleteAccountPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Same builder as GET /api/user/delete/preview (Native), so both apps show
  // the same numbers, reasons and Kul warning. A failed read renders the
  // "couldn't load your summary" state, never a zero-filled one.
  const [previewResult, { data: profileRow }, { data: firstEntry }, { data: lastEntry }] = await Promise.all([
    buildDeletionPreview(supabase, createServiceRoleSupabaseClient(), user.id),
    supabase.from('profiles').select('id, tradition').eq('id', user.id).maybeSingle(),
    supabase
      .from('journal_entries')
      .select('entry_date')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('journal_entries')
      .select('entry_date')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!previewResult.ok && previewResult.error === 'Profile not found' && !profileRow) redirect('/settings');

  let journalDaysSpanned = 0;
  if (firstEntry?.entry_date && lastEntry?.entry_date) {
    const firstDate = new Date(firstEntry.entry_date);
    const lastDate = new Date(lastEntry.entry_date);
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    journalDaysSpanned = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const exportRouteExists = existsSync(
    join(process.cwd(), 'src', 'app', 'api', 'user', 'export', 'route.ts'),
  );

  return (
    <DeleteAccountClient
      preview={previewResult.ok ? previewResult.preview : null}
      fallbackTradition={profileRow?.tradition ?? 'hindu'}
      exportAvailable={exportRouteExists}
      journalDaysSpanned={journalDaysSpanned}
    />
  );
}
