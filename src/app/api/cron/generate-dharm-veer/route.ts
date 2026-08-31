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
import { DHARM_VEER_RUNWAY, evaluateDharmVeerRunway } from '@/lib/content-job-policy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { count: approvedCount, error: countError } = await supabase
      .from('dharm_veers')
      .select('slug', { count: 'exact', head: true })
      .eq('review_status', 'approved');
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const approvedRunway = approvedCount ?? 0;
    const runway = evaluateDharmVeerRunway(approvedRunway);
    if (!runway.shouldGenerate) {
      return NextResponse.json({
        ok: true,
        status: 'runway_healthy',
        approved_runway: approvedRunway,
        target: DHARM_VEER_RUNWAY.target,
        alert: false,
      });
    }

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

    const unattemptedSeeds = HERO_SEEDS.filter(
      (seed) => !existingSlugs.has(seed.slug) && !loggedSlugs.has(seed.slug),
    );

    if (unattemptedSeeds.length === 0) {
      return NextResponse.json({
        ok: true,
        status: 'runway_depleted',
        approved_runway: approvedRunway,
        alert: runway.alert,
        generated: 0,
      });
    }

    const { error: seedError } = await supabase
      .from('dharm_veer_generation_jobs')
      .upsert(unattemptedSeeds.map((seed) => ({ slug: seed.slug })), {
        onConflict: 'slug',
        ignoreDuplicates: true,
      });
    if (seedError) {
      return NextResponse.json({ error: seedError.message }, { status: 500 });
    }

    const { data: claimedJobs, error: claimError } = await supabase.rpc(
      'claim_dharm_veer_generation_jobs',
      { p_batch_limit: 1, p_lease_minutes: 10 },
    );
    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    const claimedJob = (claimedJobs?.[0] ?? null) as { id: string; slug: string } | null;
    const seed = claimedJob ? HERO_SEEDS.find((item) => item.slug === claimedJob.slug) : null;
    if (!claimedJob || !seed) {
      return NextResponse.json({ ok: true, status: 'no_job_available', approved_runway: approvedRunway });
    }

      // ── 1. Manifest-first ──────────────────────────────────────────────
      // A verified source manifest permits generation, not publication.
      // Newly generated prose always enters the editorial review queue.
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
          reviewStatus: 'pending_review',
          sourceCitations: citationsFromSources(sources),
        });
        await supabase.from('dharm_veer_generation_log').insert({
          slug: seed.slug,
          status: 'generated_pending_review',
          notes: 'Grounded in the RAG manifest corpus; generated copy still requires editorial approval.',
        });
        await supabase.from('dharm_veer_generation_jobs').update({
          status: 'generated_pending_review', lease_until: null,
          completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq('id', claimedJob.id);

        return NextResponse.json({
          ok: true,
          status: 'generated_pending_review',
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
        await supabase.from('dharm_veer_generation_jobs').update({
          status: 'generated_pending_review', lease_until: null,
          completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq('id', claimedJob.id);

        return NextResponse.json({
          ok: true,
          status: 'generated_pending_review',
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
      await supabase.from('dharm_veer_generation_jobs').update({
        status: 'no_source', lease_until: null, last_error: 'no_source_found',
        completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', claimedJob.id);

    return NextResponse.json({
      ok: true,
      status: 'no_source_found_this_run',
      attempted: 1,
      skipped: [{ slug: seed.slug, reason: 'no_source_found' }],
      approved_runway: approvedRunway,
      alert: runway.alert,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
