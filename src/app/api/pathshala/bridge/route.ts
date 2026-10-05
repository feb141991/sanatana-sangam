import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
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

export async function POST(req: NextRequest) {
  // Require authentication — bridge is included in free plan but not open to the internet.
  // getApiUser supports native Bearer tokens and PWA cookie sessions.
  const { user, error: authError } = await getApiUser(req);
  if (!user) {
    return getApiAuthFailureResponse(authError);
  }

  const {
    lessonTitle,
    pathTitle,
    tradition,
    language = 'en',
    lastEntryMeaning,
    completedCount,
    totalLessons
  } = await req.json().catch(() => ({}));
  const responseLanguage = language === 'hi' || language === 'pa' ? language : 'en';
  const fallbackCopy = responseLanguage === 'hi'
    ? {
        bridge: 'आज की एक शिक्षा को अपनी अगली बातचीत में साथ लेकर जाएँ।',
        next: completedCount < totalLessons
          ? 'अगला पाठ आपकी यात्रा को आगे बढ़ाएगा — जब आप तैयार हों, लौटें।'
          : 'आपने यह पथ पूरा कर लिया है। अगला आरंभ करने से पहले इस पर मनन करें।',
      }
    : responseLanguage === 'pa'
      ? {
          bridge: 'ਅੱਜ ਦੀ ਇੱਕ ਸਿੱਖਿਆ ਨੂੰ ਆਪਣੀ ਅਗਲੀ ਗੱਲਬਾਤ ਵਿੱਚ ਨਾਲ ਲੈ ਕੇ ਜਾਓ।',
          next: completedCount < totalLessons
            ? 'ਅਗਲਾ ਪਾਠ ਤੁਹਾਡੀ ਯਾਤਰਾ ਨੂੰ ਅੱਗੇ ਵਧਾਏਗਾ — ਤਿਆਰ ਹੋਵੋ ਤਾਂ ਵਾਪਸ ਆਓ।'
            : 'ਤੁਸੀਂ ਇਹ ਰਾਹ ਪੂਰਾ ਕਰ ਲਿਆ ਹੈ। ਅਗਲਾ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਇਸ ਉੱਤੇ ਮਨਨ ਕਰੋ।',
        }
      : {
          bridge: 'Carry one teaching from today into the next conversation you have.',
          next: completedCount < totalLessons
            ? 'The next lesson continues this journey — return when you are ready.'
            : 'You have completed this path. Sit with it before beginning the next.',
        };

  const startTime = Date.now();

  try {
    const result = await runPathshalaBridge({
      lessonTitle,
      pathTitle,
      tradition,
      language: responseLanguage,
      lastEntryMeaning,
      completedCount,
      totalLessons,
    });

    let bridgeData = extractBridge(result.raw);
    if (!bridgeData || !bridgeData.bridge || !bridgeData.next_step) {
      bridgeData = {
        bridge: fallbackCopy.bridge,
        next_step: fallbackCopy.next,
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
      language: responseLanguage,
      ai: result.metadata,
    });
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/pathshala/bridge', latency_ms: Date.now() - startTime });
    const msg = err?.message ?? 'Bridge generation failed';

    return NextResponse.json({
      bridge: fallbackCopy.bridge,
      next_step: fallbackCopy.next,
      language: responseLanguage,
      ai: {
        provider: 'fallback',
        degraded: true,
        warning: msg,
      },
    });
  }
}
