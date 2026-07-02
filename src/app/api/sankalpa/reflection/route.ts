import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type ReflectionMood = 'strong' | 'struggling' | 'grateful';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null) as {
      sankalpa_id?: string;
      mood?: ReflectionMood;
      reflection_type?: string;
    } | null;

    const sankalpaId = body?.sankalpa_id?.trim();
    const mood = body?.mood;
    const reflectionType = body?.reflection_type?.trim() || 'midpoint';

    if (!sankalpaId || !mood || !['strong', 'struggling', 'grateful'].includes(mood)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(`${today}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const { data: existing, error: existingError } = await supabase
      .from('sankalpa_reflections')
      .select('id')
      .eq('user_id', user.id)
      .eq('sankalpa_id', sankalpaId)
      .eq('reflection_type', reflectionType)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', tomorrow.toISOString())
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json({ success: false, reason: 'already_recorded' });
    }

    const { error } = await supabase
      .from('sankalpa_reflections')
      .insert({
        user_id: user.id,
        sankalpa_id: sankalpaId,
        reflection_type: reflectionType,
        mood,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[sankalpa/reflection/POST] Failed:', err);
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
  }
}
