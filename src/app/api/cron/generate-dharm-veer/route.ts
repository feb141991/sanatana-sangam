import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  generateGroundedDharmVeerContent,
  citationsFromSources,
  getNextDharmVeerDayIndex,
  insertGeneratedDharmVeer,
  type GroundingSource,
} from '@/lib/dharm-veer-generation';
import { findSourceCandidates } from '@/lib/dharm-veer-source-finder';
import { dharamVeerRetriever } from '@/lib/ai/retrieval';
import { HERO_SEEDS } from '@/lib/dharm-veer-seeds';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Bound how many unsourceable heroes we'll burn through fetch calls on in a
// single cron invocation before giving up for the day.
const MAX_ATTEMPTS_PER_RUN = 5;

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

    const { data: logRows, error: logError } = await supabase
      .from('dharm_veer_generation_log')
      .select('slug');

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    const existingSlugs = new Set((existingRows ?? []).map((row) => row.slug));
    // Slugs already logged (generated OR no_source_found) are skipped so a
    // hero we couldn't source yesterday doesn't eat every cron run forever --
    // and so a hero we already generated (and logged) isn't re-attempted.
    const loggedSlugs = new Set((logRows ?? []).map((row) => row.slug));

    const candidateSeeds = HERO_SEEDS.filter(
      (seed) => !existingSlugs.has(seed.slug) && !loggedSlugs.has(seed.slug),
    );

    if (candidateSeeds.length === 0) {
      return NextResponse.json({ ok: true, status: 'complete', generated: 0 });
    }

    const skipped: Array<{ slug: string; reason: string }> = [];

    for (const seed of candidateSeeds.slice(0, MAX_ATTEMPTS_PER_RUN)) {
      // ── 1. Manifest-first ──────────────────────────────────────────────
      // If this hero already has a human-verified RAG manifest (the same
      // corpus that backs the dharam_veer_reflection chat mode), use it
      // directly and publish immediately -- it's already been through the
      // manual sourcing/rights review this project has done for 39 heroes.
      const manifestResult = await dharamVeerRetriever.retrieve({
        text: seed.name,
        filters: { title: seed.slug },
        topK: 8,
      });

      if (manifestResult.documents.length > 0) {
        const sources: Array<GroundingSource & { rightsStatus: string }> = manifestResult.documents.map((doc) => ({
          sourceName: doc.metadata?.sourceName || 'Parampara Pathshala Dharm Veer corpus',
          sourceUrl: '',
          excerpt: doc.content,
          rightsStatus: doc.metadata?.rightsStatus || 'restricted_or_pending',
        }));

        const content = await generateGroundedDharmVeerContent(seed, sources);
        const nextDayIndex = await getNextDharmVeerDayIndex(supabase);
        await insertGeneratedDharmVeer(supabase, seed, content, nextDayIndex, 'ai-cron-manifest', {
          sourceBacked: true,
          reviewStatus: 'approved',
          sourceCitations: citationsFromSources(sources),
        });
        await supabase.from('dharm_veer_generation_log').insert({
          slug: seed.slug,
          status: 'generated_approved',
          notes: 'Grounded in existing verified RAG manifest corpus; published directly.',
        });

        return NextResponse.json({
          ok: true,
          status: 'generated',
          mode: 'manifest',
          slug: seed.slug,
          day_index: nextDayIndex,
        });
      }

      // ── 2. Auto-source ──────────────────────────────────────────────────
      // No pre-built manifest. Try a real, non-LLM fetch against archive.org
      // for public-domain material that actually mentions this hero by name.
      const candidates = await findSourceCandidates(seed.name);

      if (candidates.length > 0) {
        const content = await generateGroundedDharmVeerContent(seed, candidates);
        const nextDayIndex = await getNextDharmVeerDayIndex(supabase);
        await insertGeneratedDharmVeer(supabase, seed, content, nextDayIndex, 'ai-cron-autosource', {
          sourceBacked: true,
          reviewStatus: 'pending_review',
          sourceCitations: citationsFromSources(candidates),
        });
        await supabase.from('dharm_veer_generation_log').insert({
          slug: seed.slug,
          status: 'generated_pending_review',
          notes: `${candidates.length} archive.org candidate(s) found and used. Awaiting human review before publish.`,
        });

        return NextResponse.json({
          ok: true,
          status: 'generated',
          mode: 'auto_sourced_pending_review',
          slug: seed.slug,
          day_index: nextDayIndex,
        });
      }

      // ── 3. No source found ────────────────────────────────────────────
      // Log it and move on to the next candidate hero within this same run
      // rather than silently doing nothing for the day.
      await supabase.from('dharm_veer_generation_log').insert({
        slug: seed.slug,
        status: 'no_source_found',
        notes: 'No manifest match and no archive.org candidate passed the relevance/rights checks.',
      });
      skipped.push({ slug: seed.slug, reason: 'no_source_found' });
    }

    return NextResponse.json({
      ok: true,
      status: 'no_source_found_this_run',
      attempted: skipped.length,
      skipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
