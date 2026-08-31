import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

type JapaCompleteBody = {
  clientCompletionId?: unknown;
  mantra?: unknown;
  count?: unknown;
  rounds?: unknown;
  durationSeconds?: unknown;
  tradition?: unknown;
  practiceType?: unknown;
  activeSymbolId?: unknown;
};

function finiteInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : null;
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as JapaCompleteBody | null;
    const clientCompletionId = typeof body?.clientCompletionId === 'string' ? body.clientCompletionId.trim() : '';
    const mantra = typeof body?.mantra === 'string' ? body.mantra.trim() : '';
    const count = finiteInteger(body?.count);
    const rounds = finiteInteger(body?.rounds);
    const durationSeconds = finiteInteger(body?.durationSeconds);

    if (!clientCompletionId || !mantra || count === null || rounds === null || durationSeconds === null) {
      return NextResponse.json({
        error: 'clientCompletionId, mantra, count, rounds, and durationSeconds are required',
      }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('complete_japa_session' as never, {
      p_client_completion_id: clientCompletionId,
      p_mantra: mantra,
      p_count: count,
      p_rounds: rounds,
      p_duration_seconds: durationSeconds,
      p_tradition: typeof body?.tradition === 'string' ? body.tradition : null,
      p_practice_type: typeof body?.practiceType === 'string' ? body.practiceType : null,
      p_active_symbol_id: typeof body?.activeSymbolId === 'string' ? body.activeSymbolId : null,
    } as never);

    if (error) {
      const status = error.code === '22023' ? 400 : 500;
      console.error('[api/japa/complete] atomic completion failed', error.code, error.message);
      return NextResponse.json({ error: status === 400 ? error.message : 'Could not save Japa session' }, { status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/japa/complete]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
