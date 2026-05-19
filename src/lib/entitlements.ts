export type SubscriptionStatus = 'free' | 'pro' | 'kul_pro' | 'grace' | 'expired';

export type EntitlementSnapshot = {
  isPro: boolean;
  status: SubscriptionStatus;
  expiresAt: string | null;
  source: string | null;
  updatedAt: string | null;
  isEarlyAccess: boolean;
};

type ProfileEntitlementFields = Partial<{
  is_pro: boolean | null;
  subscription_status: SubscriptionStatus | null;
  subscription_expires_at: string | null;
  entitlement_source: string | null;
  entitlement_updated_at: string | null;
  pro_note: string | null;
}>;

export function resolveEntitlement(profile: ProfileEntitlementFields | null | undefined): EntitlementSnapshot {
  const status = profile?.subscription_status ?? (profile?.is_pro ? 'pro' : 'free');
  const source = profile?.entitlement_source ?? profile?.pro_note ?? null;
  const isPro = status === 'pro' || status === 'kul_pro' || status === 'grace' || Boolean(profile?.is_pro);

  return {
    isPro,
    status,
    expiresAt: profile?.subscription_expires_at ?? null,
    source,
    updatedAt: profile?.entitlement_updated_at ?? null,
    isEarlyAccess: source === 'early_access',
  };
}
