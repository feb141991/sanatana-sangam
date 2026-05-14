import { createServerSupabaseClient } from '@/lib/supabase-server';
import KathaClient from './KathaClient';
import { ALL_KATHAS, getKathasByTradition } from '@/lib/katha-library';

export const dynamic = 'force-dynamic';

export default async function KathaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tradition = 'hindu';
  let userName = 'Sadhak';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition, name')
      .eq('id', user.id)
      .single();
    if (profile) {
      tradition = profile.tradition || 'hindu';
      userName = profile.name || 'Sadhak';
    }
  }

  // Today's featured katha — rotate by day of year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const todayKatha = ALL_KATHAS[dayOfYear % ALL_KATHAS.length];

  // This week's kathas — next 5 after today's
  const weekKathas = Array.from({ length: 5 }, (_, i) => ALL_KATHAS[(dayOfYear + i + 1) % ALL_KATHAS.length]);

  // Tradition kathas
  const traditionKathas = getKathasByTradition(tradition as any).slice(0, 6);

  return (
    <KathaClient
      todayKatha={todayKatha}
      weekKathas={weekKathas}
      traditionKathas={traditionKathas}
      allKathas={ALL_KATHAS}
      tradition={tradition}
      userName={userName}
    />
  );
}
