import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCandidateTypePipelineMode, shouldProcessCandidateType } from '@/lib/notification-candidate-pipeline-mode';
import { getLocalDateIso, isValidTimeZone } from '@/lib/sacred-time';
import { produceSankalpaMidpointCandidate } from '@/lib/sankalpa-midpoint-candidate';
import type { NotificationCandidateInsert } from '@/types/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAGE_SIZE = 500;

type OptedInProfile = {
  id: string;
  timezone: string;
  app_language: string | null;
};

type ActiveSankalpa = {
  id: string;
  user_id: string;
  target_days: number;
  start_date: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseOptedInProfiles(value: unknown): OptedInProfile[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isObject(item) || typeof item.id !== 'string' || typeof item.timezone !== 'string') return [];
    return [{
      id: item.id,
      timezone: item.timezone,
      app_language: typeof item.app_language === 'string' ? item.app_language : null,
    }];
  });
}

function parseActiveSankalpas(value: unknown): ActiveSankalpa[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      !isObject(item)
      || typeof item.id !== 'string'
      || typeof item.user_id !== 'string'
      || typeof item.target_days !== 'number'
      || typeof item.start_date !== 'string'
    ) return [];
    return [{ id: item.id, user_id: item.user_id, target_days: item.target_days, start_date: item.start_date }];
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode = getCandidateTypePipelineMode('sankalpa_midpoint');
  if (!shouldProcessCandidateType('sankalpa_midpoint')) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'sankalpa_midpoint_candidate_pipeline_not_enabled',
      mode,
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase environment' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();

  try {
    const optedInProfiles: OptedInProfile[] = [];
    let lastProfileId: string | null = null;
    for (;;) {
      let profileQuery = supabase
        .from('profiles')
        .select('id, timezone, app_language')
        .eq('wants_sankalpa_midpoint_reminders', true)
        .or('is_deleting.is.null,is_deleting.eq.false')
        .order('id', { ascending: true })
        .limit(PAGE_SIZE);
      if (lastProfileId) profileQuery = profileQuery.gt('id', lastProfileId);
      const { data, error } = await profileQuery;
      if (error) throw new Error(`Opted-in profile query failed: ${error.message}`);
      const page = parseOptedInProfiles(data);
      optedInProfiles.push(...page.filter((profile) => isValidTimeZone(profile.timezone)));
      if (!Array.isArray(data) || data.length < PAGE_SIZE) break;
      lastProfileId = page[page.length - 1]?.id ?? null;
      if (!lastProfileId) throw new Error('Opted-in profile page returned no stable cursor id');
    }

    if (optedInProfiles.length === 0) {
      return NextResponse.json({ ok: true, mode, checked: 0, candidatesGenerated: 0, candidatesInserted: 0 });
    }

    const profileById = new Map(optedInProfiles.map((profile) => [profile.id, profile]));
    const candidates: NotificationCandidateInsert[] = [];
    let checked = 0;
    let lastSankalpaId: string | null = null;

    for (;;) {
      let query = supabase
        .from('sankalpas')
        .select('id, user_id, target_days, start_date')
        .eq('status', 'active')
        .order('id', { ascending: true })
        .limit(PAGE_SIZE);
      if (lastSankalpaId) query = query.gt('id', lastSankalpaId);
      const { data, error } = await query;
      if (error) throw new Error(`Active Sankalpa query failed: ${error.message}`);
      const page = parseActiveSankalpas(data);
      checked += page.length;

      for (const sankalpa of page) {
        const profile = profileById.get(sankalpa.user_id);
        if (!profile) continue;
        const localDate = getLocalDateIso(now, profile.timezone);
        const candidate = produceSankalpaMidpointCandidate({
          userId: profile.id,
          sankalpaId: sankalpa.id,
          startDate: sankalpa.start_date,
          targetDays: sankalpa.target_days,
          localDate,
          timezone: profile.timezone,
          language: profile.app_language,
          optedIn: true,
          now,
        });
        if (candidate) candidates.push(candidate);
      }

      if (!Array.isArray(data) || data.length < PAGE_SIZE) break;
      lastSankalpaId = page[page.length - 1]?.id ?? null;
      if (!lastSankalpaId) throw new Error('Active Sankalpa page returned no stable cursor id');
    }

    let inserted = 0;
    for (let offset = 0; offset < candidates.length; offset += 250) {
      const batch = candidates.slice(offset, offset + 250);
      const { data, error } = await supabase
        .from('notification_candidates')
        .upsert(batch, {
          onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
          ignoreDuplicates: true,
        })
        .select('id');
      if (error) throw new Error(`Sankalpa candidate upsert failed: ${error.message}`);
      inserted += data?.length ?? 0;
    }

    return NextResponse.json({
      ok: true,
      mode,
      checked,
      optedInProfiles: optedInProfiles.length,
      candidatesGenerated: candidates.length,
      candidatesInserted: inserted,
    });
  } catch (error) {
    console.error('[sankalpa-checkin] candidate generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Candidate generation failed' },
      { status: 500 },
    );
  }
}
