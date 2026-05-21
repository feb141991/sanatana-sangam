import type { ModelAdapter, PromptSpec, TextResult } from '@sangam/pramana-core';

export interface GeminiAdapterOptions {
  apiKey: string;
  models?: string[];
}

const DEFAULT_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function extractGeminiText(data: any): string {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  const parts = candidates.flatMap((candidate: any) =>
    Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
  );
  const text = parts
    .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
  return text;
}

function summarizeGeminiEmptyResponse(model: string, data: any): string {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  const finishReasons = candidates
    .map((candidate: any) => candidate?.finishReason || candidate?.finish_reason)
    .filter(Boolean)
    .join(',');
  const blockReason = data?.promptFeedback?.blockReason || data?.prompt_feedback?.block_reason || null;
  const pieces = [`${model}: empty response`];
  if (finishReasons) pieces.push(`finishReason=${finishReasons}`);
  if (blockReason) pieces.push(`blockReason=${blockReason}`);
  return pieces.join(' ');
}

export class GeminiModelAdapter implements ModelAdapter {
  constructor(private readonly options: GeminiAdapterOptions) {}

  async generate(prompt: PromptSpec): Promise<TextResult> {
    const models = this.options.models?.length ? this.options.models : DEFAULT_MODELS;
    const attempts: string[] = [];

    for (const model of models) {
      const contents: any[] = [];
      let systemInstruction: any = undefined;

      if (prompt.system && !prompt.messages?.length) {
        // Fallback for old style prompt
        contents.push({
          role: 'user',
          parts: [{ text: [prompt.system, prompt.user].filter(Boolean).join('\n\n') }]
        });
      } else {
        if (prompt.system) {
          systemInstruction = { parts: [{ text: prompt.system }] };
        }
        if (prompt.messages) {
          for (const msg of prompt.messages) {
            contents.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            });
          }
        }
        if (prompt.user) {
          contents.push({
            role: 'user',
            parts: [{ text: prompt.user }]
          });
        }
      }

      const res = await fetch(`${geminiUrl(model)}?key=${this.options.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: systemInstruction,
          contents,
          generationConfig: {
            temperature: prompt.temperature ?? 0.3,
            maxOutputTokens: prompt.maxOutputTokens ?? 800,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = extractGeminiText(data);
        if (text) {
          return {
            text,
            modelUsed: model,
            provider: 'gemini',
          };
        }
        attempts.push(summarizeGeminiEmptyResponse(model, data));
        continue;
      }

      if (res.status === 429 || res.status === 404) {
        attempts.push(`${model}: HTTP ${res.status}`);
        continue;
      }
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
    }

    const detail = attempts.length > 0 ? ` Attempts: ${attempts.join(' | ')}` : '';
    throw new Error(`No response generated. Please try again.${detail}`);
  }
}
