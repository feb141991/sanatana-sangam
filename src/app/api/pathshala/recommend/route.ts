import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { runPathshalaRecommend } from '@/lib/ai/router';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { createAdminClient } from '@/lib/supabase-admin';
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

export async function POST(req: Request) {
  // Auth guard — use the server-verified user, never trust client-provided userId.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
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
  const adminClient = createAdminClient();

  try {
    // 1. Fetch completed paths
    const { data: progressData, error: progressError } = await adminClient
      .from('guided_path_progress')
      .select('path_id, status')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const completedPathIds = !progressError && progressData 
      ? (progressData as any[]).map(p => p.path_id) 
      : [];

    // 2. Fetch current mood (latest)
    const { data: moodData } = await adminClient
      .from('user_mood_checkins')
      .select('mood')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    const currentMood = (moodData as any)?.mood || undefined;

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
