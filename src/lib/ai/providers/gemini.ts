import { GeminiModelAdapter } from '@sangam/pramana-serve';
import type { AIPromptSpec, AITextResult } from '@/lib/ai/contracts';

export async function generateWithGemini(
  prompt: AIPromptSpec,
  options?: { models?: string[] }
): Promise<AITextResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const adapter = new GeminiModelAdapter({
    apiKey,
    models: options?.models,
  });

  return adapter.generate(prompt);
}
