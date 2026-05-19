import type { AIPromptSpec, AITextResult } from '@/lib/ai/contracts';

const DEFAULT_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export async function generateWithGemini(
  prompt: AIPromptSpec,
  options?: { models?: string[] }
): Promise<AITextResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const models = options?.models?.length ? options.models : DEFAULT_MODELS;

  for (const model of models) {
    const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: [prompt.system, prompt.user].filter(Boolean).join('\n\n') }],
          },
        ],
        generationConfig: {
          temperature: prompt.temperature ?? 0.3,
          maxOutputTokens: prompt.maxOutputTokens ?? 800,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (text) {
        return {
          text,
          modelUsed: model,
          provider: 'gemini',
        };
      }
    }

    if (res.status === 429 || res.status === 404) continue;
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  throw new Error('No response generated. Please try again.');
}
