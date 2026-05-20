import { NextResponse } from 'next/server';
import { runPathshalaExplain } from '@/lib/ai/router';
import { emitEvent, emitError } from '@/lib/monitoring/events';

function extractExplanation(raw: string) {
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
    sanskrit,
    originalText,
    transliteration,
    translation,
    source,
    title,
    tradition,
    language = 'en',
    responseMode,
  } = await req.json().catch(() => ({}));

  const startTime = Date.now();
  try {
    const result = await runPathshalaExplain({
      sanskrit,
      originalText,
      transliteration,
      translation,
      source,
      title,
      tradition,
      language,
      responseMode,
    });

    let explanation = extractExplanation(result.raw);
    if (!explanation) {
      explanation = {
        word_by_word:      '',
        meaning:           translation ?? '',
        commentary:        '',
        daily_application: 'Reflect on this verse during your practice today.',
        contemplation:     'How does this teaching speak to your life right now?',
        related_text:      '',
      };
    }

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/pathshala/explain',
      latency_ms: Date.now() - startTime,
      provider: result.metadata?.provider,
      model: result.metadata?.model,
      fallback_used: result.metadata?.usedHostedFallback
    });

    return NextResponse.json({
      explanation,
      tradition: result.school,
      teacher:   result.teacher,
      source,
      title,
      ai: result.metadata,
    });
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/pathshala/explain', latency_ms: Date.now() - startTime });
    const msg = err?.message ?? 'Explain failed';
    const status = String(msg).includes('required') ? 400 : String(msg).includes('configured') ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
