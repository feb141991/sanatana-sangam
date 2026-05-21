/**
 * Deno-compatible Pramana inference client for Supabase Edge Functions.
 *
 * Mirrors the provider-stack priority used in the Next.js app:
 *   1. Sarvam (sarvam-30b)  — primary when SARVAM_API_KEY is set
 *   2. Gemini flash          — fallback (GEMINI_API_KEY)
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

const SARVAM_URL  = 'https://api.sarvam.ai/v1/chat/completions';
const GEMINI_URL  = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Generate text using Sarvam → Gemini fallback chain.
 * Throws only if both providers fail.
 */
export async function generateText(
  userPrompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const sarvamKey = Deno.env.get('SARVAM_API_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  // ── 1. Sarvam (OpenAI-compatible) ──────────────────────────────────────────
  if (sarvamKey) {
    try {
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

      if (resp.ok) {
        const data = await resp.json();
        // Support both standard choices[0].message.content and output_text
        const text: string | undefined =
          data?.choices?.[0]?.message?.content ||
          data?.output_text;
        if (text) return text.trim();
      } else {
        console.warn(`[pramana] Sarvam ${resp.status} — falling back to Gemini`);
      }
    } catch (err) {
      console.warn('[pramana] Sarvam error — falling back to Gemini:', err);
    }
  }

  // ── 2. Gemini fallback ──────────────────────────────────────────────────────
  if (!geminiKey) {
    throw new Error('[pramana] No inference provider available: set SARVAM_API_KEY or GEMINI_API_KEY');
  }

  const contents: Array<{ parts: Array<{ text: string }> }> = [];
  if (options.system) {
    // Gemini doesn't have a system role — prepend to user turn
    contents.push({ parts: [{ text: `${options.system}\n\n${userPrompt}` }] });
  } else {
    contents.push({ parts: [{ text: userPrompt }] });
  }

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.5,
        maxOutputTokens: options.maxTokens ?? 800,
      },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`[pramana] Gemini ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('[pramana] Gemini returned empty response');
  return text.trim();
}
