import { NextResponse } from 'next/server';
import { runPathshalaBridge } from '@/lib/ai/router';
import { emitEvent, emitError } from '@/lib/monitoring/events';

function extractBridge(raw: string) {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const {
    lessonTitle,
    pathTitle,
    tradition,
    language = 'en',
    lastEntryMeaning,
    completedCount,
    totalLessons
  } = await req.json().catch(() => ({}));

  const startTime = Date.now();

  try {
    const result = await runPathshalaBridge({
      lessonTitle,
      pathTitle,
      tradition,
      language,
      lastEntryMeaning,
      completedCount,
      totalLessons,
    });

    let bridgeData = extractBridge(result.raw);
    if (!bridgeData || !bridgeData.bridge || !bridgeData.next_step) {
      bridgeData = {
        bridge: "Carry one teaching from today into the next conversation you have.",
        next_step: completedCount < totalLessons
          ? "The next lesson continues this journey — return when you are ready."
          : "You have completed this path. Sit with it before beginning the next."
      };
    }

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/pathshala/bridge',
      latency_ms: Date.now() - startTime,
      provider: result.metadata?.provider,
      model: result.metadata?.model,
      context: {
        fallback_used: result.metadata?.usedHostedFallback ?? false,
        cached: result._cached === true,
        tradition: tradition ?? 'unknown'
      }
    });

    return NextResponse.json({
      bridge: bridgeData.bridge,
      next_step: bridgeData.next_step,
      ai: result.metadata,
    });
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/pathshala/bridge', latency_ms: Date.now() - startTime });
    const msg = err?.message ?? 'Bridge generation failed';

    return NextResponse.json({
      bridge: "Carry one teaching from today into the next conversation you have.",
      next_step: completedCount < totalLessons
        ? "The next lesson continues this journey — return when you are ready."
        : "You have completed this path. Sit with it before beginning the next.",
      ai: {
        provider: 'fallback',
        degraded: true,
        warning: msg,
      },
    });
  }
}
