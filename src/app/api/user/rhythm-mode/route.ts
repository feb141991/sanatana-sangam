import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type RhythmMode = 'morning' | 'full_day' | 'advanced';

const VALID_MODES = new Set<RhythmMode>(['morning', 'full_day', 'advanced']);

export const dynamic = 'force-dynamic';

function isRhythmMode(mode: unknown): mode is RhythmMode {
  return typeof mode === 'string' && VALID_MODES.has(mode as RhythmMode);
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as { mode?: unknown } | null;
    if (!isRhythmMode(body?.mode)) {
      return NextResponse.json({ error: 'Invalid rhythm mode' }, { status: 400 });
    }
    const mode = body.mode;

    if (mode === 'advanced') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile?.is_pro) {
        return NextResponse.json(
          { error: 'Advanced Dinacharya requires Pro' },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ nitya_rhythm_mode: mode } as never)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ mode });
  } catch (error) {
    console.error('[api/user/rhythm-mode PATCH]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
