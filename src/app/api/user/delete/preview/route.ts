import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getUnlockedRelics } from '@/lib/relics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const DELETION_REASONS = [
  { id: 'taking_break', label: 'Taking a temporary spiritual break' },
  { id: 'too_many_notifications', label: 'Too many notifications or reminders' },
  { id: 'privacy_concerns', label: 'Privacy or data concerns' },
  { id: 'not_useful', label: 'Not finding the practice features helpful' },
  { id: 'technical_issues', label: 'App performance or technical bugs' },
  { id: 'other', label: 'Other reason', requireDetails: true },
] as const;

export type DeletionPreviewResponse = {
  success: boolean;
  userName: string;
  tradition: string;
  streak: number;
  karmaPoints: number;
  sevaScore: number;
  relicsCount: number;
  journalCount: number;
  activeSankalpas: number;
  isPro: boolean;
  ownedKuls: Array<{ id: string; name: string }>;
  ownedMandalis: Array<{ id: string; name: string }>;
  reasons: typeof DELETION_REASONS;
};

/**
 * Canonical snapshot preview route for account deletion cool-off.
 * Returns authentic stats (streak, genuine unlocked relics, journal count,
 * owned Kuls/Mandalis, and subscription status) so neither Native nor Web
 * ever fabricate or guess metrics client-side.
 */
export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return getApiAuthFailureResponse(authError);
  }

  const adminSupabase = createServiceRoleSupabaseClient();

  const [profileRes, sadhanaRes, journalRes, kulsRes, mandalisRes, sankalpaRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, tradition, karma_points, seva_score, shloka_streak, is_pro, subscription_status')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('daily_sadhana')
      .select('streak_count')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    adminSupabase
      .from('kuls')
      .select('id, name')
      .eq('created_by', user.id),
    adminSupabase
      .from('mandalis')
      .select('id, name')
      .eq('created_by', user.id),
    supabase
      .from('sankalpas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ]);

  const prof = profileRes.data;
  const streak = sadhanaRes.data?.streak_count ?? prof?.shloka_streak ?? 0;
  const karmaPoints = prof?.karma_points ?? 0;
  const sevaScore = prof?.seva_score ?? 0;
  const tradition = prof?.tradition ?? 'hindu';
  const userName = prof?.full_name || prof?.username || 'Seeker';
  const journalCount = journalRes.count ?? 0;
  const activeSankalpas = sankalpaRes.count ?? 0;
  const isPro = Boolean(prof?.is_pro || prof?.subscription_status === 'active' || prof?.subscription_status === 'pro');

  // Real unlocked relics count computed canonically from @/lib/relics (Rule 3: Never Fabricate)
  const unlockedRelics = getUnlockedRelics(streak, sevaScore, tradition);
  const relicsCount = unlockedRelics.length;

  const ownedKuls = (kulsRes.data ?? []).map((k: { id: string; name: string }) => ({ id: k.id, name: k.name }));
  const ownedMandalis = (mandalisRes.data ?? []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));

  const response: DeletionPreviewResponse = {
    success: true,
    userName,
    tradition,
    streak,
    karmaPoints,
    sevaScore,
    relicsCount,
    journalCount,
    activeSankalpas,
    isPro,
    ownedKuls,
    ownedMandalis,
    reasons: DELETION_REASONS,
  };

  return NextResponse.json(response);
}
