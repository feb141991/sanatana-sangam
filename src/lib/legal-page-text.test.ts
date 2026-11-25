import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The legal pages sit on a light card (PublicPageShell). On 2026-11-25 their region tabs and
 * "Last Updated" line were translucent white (about 1:1 contrast) and the terms summaries were
 * gold (about 2:1), so people could not find the section for their own country.
 */
const PAGES = [
  'src/app/privacy/PrivacyClient.tsx',
  'src/app/terms/TermsClient.tsx',
  'src/app/guidelines/page.tsx',
];

describe('legal pages use text a person can read on the light card', () => {
  it.each(PAGES)('%s has no white or gold text', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8');
    expect(source).not.toMatch(/(?<![\w-])text-white(?![\w-])/);
    expect(source).not.toContain('text-[#C5A059]');
  });
});
