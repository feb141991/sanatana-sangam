import type { ModelAdapter, PromptSpec, TextResult } from '@sangam/pramana-core';

export interface GeminiAdapterOptions {
  apiKey: string;
  models?: string[];
}

const DEFAULT_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export class GeminiModelAdapter implements ModelAdapter {
  constructor(private readonly options: GeminiAdapterOptions) {}

  async generate(prompt: PromptSpec): Promise<TextResult> {
    const models = this.options.models?.length ? this.options.models : DEFAULT_MODELS;

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
}
