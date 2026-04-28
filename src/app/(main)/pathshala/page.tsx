import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import PathshalaClient from './PathshalaClient';

export default async function PathshalaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition')
    .eq('id', user.id)
    .single();

  const params = await searchParams;
  const validTabs = ['learn', 'scripture', 'explore'] as const;
  type Tab = typeof validTabs[number];
  const initialTab: Tab = validTabs.includes(params.tab as Tab)
    ? (params.tab as Tab)
    : 'learn';

  return (
    <PathshalaClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sadhak'}
      tradition={profile?.tradition ?? 'hindu'}
      initialTab={initialTab}
    />
  );
}
