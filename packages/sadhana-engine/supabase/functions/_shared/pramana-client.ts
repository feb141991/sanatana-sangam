/**
 * Deno-compatible Pramana inference client for Supabase Edge Functions.
 * Sarvam (sarvam-30b) is the sole provider.
 *
 * Usage:
 *   import { generateText } from '../_shared/pramana-client.ts';
 *   const text = await generateText(prompt, { temperature: 0.7, maxTokens: 512 });
 */

export interface GenerateOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

const SARVAM_URL = 'https://api.sarvam.ai/v1/chat/completions';

export async function generateText(
  userPrompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const sarvamKey = Deno.env.get('SARVAM_API_KEY');
  if (!sarvamKey) {
    throw new Error('[pramana] SARVAM_API_KEY not set — inference unavailable');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (options.system) messages.push({ role: 'system', content: options.system });
  messages.push({ role: 'user', content: userPrompt });

  const resp = await fetch(SARVAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': sarvamKey,
    },
    body: JSON.stringify({
      model: 'sarvam-30b',
      messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 800,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`[pramana] Sarvam ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text: string | undefined =
    data?.choices?.[0]?.message?.content ||
    data?.output_text;
  if (!text) throw new Error('[pramana] Sarvam returned empty response');
  return text.trim();
}
