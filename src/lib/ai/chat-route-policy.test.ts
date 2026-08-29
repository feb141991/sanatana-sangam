import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Dharma Mitra generation policy', () => {
  it('disables hidden reasoning for the short general-chat path', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/ai/chat/route.ts'),
      'utf8'
    );
    const generalChatPath = source.slice(source.indexOf('// ── Path: Sarvam / Pramana'));

    expect(generalChatPath).toContain("reasoningEffort: 'none'");
    expect(generalChatPath).toContain('maxOutputTokens: 500');
  });
});
