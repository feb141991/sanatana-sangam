import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import FoundingKitClient from './FoundingKitClient';

export default async function FoundingKitPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, tradition, is_founding_member, founding_number')
    .eq('id', user.id)
    .single();

  const isFoundingMember = !!(profile?.is_founding_member || (typeof profile?.founding_number === 'number' && profile.founding_number > 0));

  let referralCount = 0;
  if (isFoundingMember && typeof profile?.founding_number === 'number') {
    const { count, error } = await supabase
      .from('referral_attributions')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_sthapaka_number', profile.founding_number);
    if (!error && count !== null) {
      referralCount = count;
    }
  }

  return (
    <FoundingKitClient
      profile={profile}
      isFoundingMember={isFoundingMember}
      referralCount={referralCount}
    />
  );
}
