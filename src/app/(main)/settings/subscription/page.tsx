import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SubscriptionClient from './SubscriptionClient';

export default async function SubscriptionPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_id, subscription_plan_id, subscription_expires_at, entitlement_source, tradition')
    .eq('id', user.id)
    .single();

  return (
    <SubscriptionClient 
      status={profile?.subscription_status || 'free'}
      planId={profile?.subscription_plan_id || null}
      subscriptionId={profile?.subscription_id || null}
      expiresAt={profile?.subscription_expires_at || null}
      entitlementSource={profile?.entitlement_source || null}
      tradition={profile?.tradition || null}
    />
  );
}
