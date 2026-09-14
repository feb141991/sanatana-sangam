import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { SACRED_RELICS } from '@/lib/relics';

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  tradition: string | null;
  sampradaya: string | null;
  ishta_devata: string | null;
  city: string | null;
  country: string | null;
  seva_score: number | null;
  karma_points: number | null;
  life_stage: string | null;
  active_symbol_id: string | null;
  created_at: string | null;
  mandali_id: string | null;
  shloka_streak: number | null;
};

type MandaliRow = {
  name: string;
  city: string | null;
  country: string | null;
};

type SadhanaRow = {
  streak_count: number | null;
};

const PUBLIC_PROFILE_FIELDS =
  'id, full_name, username, avatar_url, bio, tradition, sampradaya, ishta_devata, city, country, seva_score, karma_points, life_stage, active_symbol_id, created_at, mandali_id, shloka_streak';

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const admin = createAdminClient();
  const profileQuery = await admin.from('profiles').select(PUBLIC_PROFILE_FIELDS).eq('id', id).maybeSingle();
  const data = profileQuery.data as ProfileRow | null;
  const error = profileQuery.error;

  if (error) {
    console.error('[mandali/member-profile] failed', error.message);
    return NextResponse.json({ error: 'Could not load profile.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  // Parallel fetch aggregate sadhana highlights, mandali, and relic details
  const [mandaliResult, sadhanaResult, malasResult] = await Promise.all([
    data.mandali_id
      ? (admin.from('mandalis').select('name, city, country').eq('id', data.mandali_id).maybeSingle() as unknown as Promise<{ data: MandaliRow | null }>)
      : Promise.resolve({ data: null }),
    admin
      .from('daily_sadhana')
      .select('streak_count')
      .eq('user_id', id)
      .not('streak_count', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: SadhanaRow | null }>,
    admin
      .from('mala_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id),
  ]);

  const streakCount = sadhanaResult.data?.streak_count ?? data.shloka_streak ?? 0;
  const totalMalas = malasResult.count ?? 0;
  const relic = data.active_symbol_id
    ? SACRED_RELICS.find((r) => r.id === data.active_symbol_id) ?? null
    : null;

  const profilePayload = {
    ...data,
    streak_count: streakCount,
    total_malas: totalMalas,
    mandali: mandaliResult.data
      ? {
          name: mandaliResult.data.name,
          city: mandaliResult.data.city,
          country: mandaliResult.data.country,
        }
      : null,
    relic: relic
      ? {
          id: relic.id,
          name: relic.name,
          imageUrl: relic.imageUrl,
          description: relic.description,
        }
      : null,
  };

  return NextResponse.json({ profile: profilePayload });
}
