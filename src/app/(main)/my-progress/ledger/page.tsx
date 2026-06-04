import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import LedgerClient from './LedgerClient';

export default async function SevaLedgerPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch all karma ledger records for the current user, sorted by created_at DESC
  const { data: ledgerRows, error } = await supabase
    .from('karma_ledger')
    .select('id, amount, reason, source_route, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[seva-ledger] Failed to fetch karma ledger:', error);
  }

  return <LedgerClient initialLedger={ledgerRows || []} />;
}
