import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { runPathshalaRecommend } from '@/lib/ai/router';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { SEED_PATHS } from '@/lib/pathshala-paths';

function extractReason(raw: string) {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]) as Record<string, string>;
  } catch {
    return null;
  }
}

function isCompletedPathRow(value: unknown): value is { path_id: string } {
  return typeof value === 'object'
    && value !== null
    && 'path_id' in value
    && typeof value.path_id === 'string';
}

function readMood(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('mood' in value)) return undefined;
  return typeof value.mood === 'string' ? value.mood : undefined;
}

export async function POST(req: NextRequest) {
  // Auth guard — use the server-verified user, never trust client-provided userId.
  // Reuse the authenticated client so native Bearer and PWA cookie callers
  // receive the same RLS-protected behavior.
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
  }

  const {
    tradition,
    language = 'en',
  } = await req.json().catch(() => ({}));

  // userId is now always the authenticated user — ignore any client-provided value.
  const userId = user.id;

  if (!tradition) {
    return NextResponse.json({ error: 'Missing tradition' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    // 1. Fetch completed paths
    const { data: progressData, error: progressError } = await supabase
      .from('guided_path_progress')
      .select('path_id, status')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const completedPathIds = !progressError && Array.isArray(progressData)
      ? progressData.filter(isCompletedPathRow).map((progress) => progress.path_id)
      : [];

    // 2. Fetch current mood (latest)
    const { data: moodData } = await supabase
      .from('user_mood_checkins')
      .select('mood')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    const currentMood = readMood(moodData);

    // 3. Algorithm to select the path
    const traditionPaths = SEED_PATHS.filter(p => p.tradition === tradition);
    const incompletePaths = traditionPaths.filter(p => !completedPathIds.includes(p.id));
    
    let selectedPathId = '';
    let selectedPathTitle = '';

    const defaultByTradition: Record<string, string> = {
      'hindu': 'bhagavad-gita-intro',
      'sikh': 'japji-sahib-deep',
      'buddhist': 'four-noble-truths',
      'jain': 'namokar-mantra-foundation',
    };

    const priorityPathId = defaultByTradition[tradition];

    if (priorityPathId && !completedPathIds.includes(priorityPathId)) {
      selectedPathId = priorityPathId;
      selectedPathTitle = SEED_PATHS.find(p => p.id === priorityPathId)?.title || priorityPathId;
    } else if (incompletePaths.length > 0) {
      selectedPathId = incompletePaths[0].id;
      selectedPathTitle = incompletePaths[0].title;
    } else {
      // Fallback if all tradition paths completed
      const fallbackPath = SEED_PATHS.find(p => p.tradition === 'hindu') || SEED_PATHS[0];
      selectedPathId = fallbackPath.id;
      selectedPathTitle = fallbackPath.title;
    }

    // 4. Call AI to get the reason
    const result = await runPathshalaRecommend({
      tradition,
      completedPathIds,
      currentMood,
      language,
      pathTitle: selectedPathTitle
    });

    let reasonData = extractReason(result.raw);
    if (!reasonData || !reasonData.reason) {
      reasonData = {
        reason: "This path aligns with your tradition and is a strong foundation for daily practice."
      };
    }

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/pathshala/recommend',
      latency_ms: Date.now() - startTime,
      provider: result.metadata?.provider,
      model: result.metadata?.model,
      context: {
        fallback_used: result.metadata?.usedHostedFallback ?? false,
        cached: result._cached === true,
        tradition: tradition ?? 'unknown',
        path_id: selectedPathId
      }
    });

    return NextResponse.json({
      pathId: selectedPathId,
      pathTitle: selectedPathTitle,
      reason: reasonData.reason,
      ai: result.metadata,
    });
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/pathshala/recommend', latency_ms: Date.now() - startTime });
    const msg = err?.message ?? 'Recommend generation failed';

    // Even if AI fails entirely, we have a deterministic path selected. Let's do a best effort to return it
    // if we haven't selected it yet, we just default to hindu fallback.
    const fallbackPath = SEED_PATHS.find(p => p.tradition === 'hindu') || SEED_PATHS[0];
    
    return NextResponse.json({
      pathId: fallbackPath.id,
      pathTitle: fallbackPath.title,
      reason: "This path aligns with your tradition and is a strong foundation for daily practice.",
      ai: {
        provider: 'fallback',
        degraded: true,
        warning: msg,
      },
    });
  }
}
