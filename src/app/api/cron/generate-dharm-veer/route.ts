import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { generateDharmVeerContent, getNextDharmVeerDayIndex, insertGeneratedDharmVeer } from '@/lib/dharm-veer-generation';
import { HERO_SEEDS } from '@/lib/dharm-veer-seeds';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: existingRows, error } = await supabase
      .from('dharm_veers')
      .select('slug');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const existingSlugs = new Set((existingRows ?? []).map((row) => row.slug));
    const nextSeed = HERO_SEEDS.find((seed) => !existingSlugs.has(seed.slug));

    if (!nextSeed) {
      return NextResponse.json({ ok: true, status: 'complete', generated: 0 });
    }

    const content = await generateDharmVeerContent(nextSeed);
    const nextDayIndex = await getNextDharmVeerDayIndex(supabase);
    await insertGeneratedDharmVeer(supabase, nextSeed, content, nextDayIndex, 'ai-cron');

    return NextResponse.json({
      ok: true,
      status: 'generated',
      slug: nextSeed.slug,
      day_index: nextDayIndex,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
