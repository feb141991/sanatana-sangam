import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// vitest cannot transform .tsx here (tsconfig keeps jsx: preserve), so, like the
// other page-contract tests in this repo, these assert on the page source.
const pagePath = fileURLToPath(new URL('./page.tsx', import.meta.url));
const page = readFileSync(pagePath, 'utf8');

const FABRICATED_TALLIES = ['1,420,000', '48,500', '18,400', 'Japa Malas Turned', 'Muhurtas Observed', 'Hours of Scripture Contemplation'];

function sourceFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFilesUnder(full));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

describe('/community page copy matches what exists', () => {
  it('has no usage tallies: the old 1,420,000+ malas / 48,500+ muhurtas / 18,400+ hours were hard-coded constants', () => {
    for (const claim of FABRICATED_TALLIES) expect(page, claim).not.toContain(claim);
    expect(page).not.toContain('sankalpaMetrics');
    // Class guard: any quoted "N,NNN+" figure on this page needs computed data behind it.
    expect(page.match(/["'`]\d{1,3}(?:,\d{3})+\+["'`]/g) ?? []).toEqual([]);
  });

  it('does not reappear anywhere else in the app source', () => {
    const srcRoot = fileURLToPath(new URL('../../../', import.meta.url));
    const offenders = sourceFilesUnder(srcRoot).filter((file) => {
      const text = readFileSync(file, 'utf8');
      return FABRICATED_TALLIES.some((claim) => text.includes(claim));
    });
    expect(offenders).toEqual([]);
  });

  it('labels the circles as planned, exactly four of them, and never as running or in testing', () => {
    expect(page.match(/^const localCircles = \[/gm)).toHaveLength(1);
    const circles = page.slice(page.indexOf('const localCircles'), page.indexOf('const covenantPillars'));
    expect(circles.match(/title: "/g)).toHaveLength(4);
    expect(page.match(/Planned · not yet open/g)).toHaveLength(1); // rendered once per card via .map
    expect(page).not.toContain('Circle in Private Testing');
    expect(page).toContain('They are not open yet');
  });

  it('does not conflate Jain Prakrit with Buddhist Pali texts', () => {
    expect(page).not.toContain('Prakrit');
    expect(page).not.toContain('Sutta Contemplation');
  });

  it('makes no promise the signup does not keep: it records interest only', () => {
    for (const promise of ['whitelist your access', 'invitation link', 'Private Testing Queue', 'onboarding early seekers']) {
      expect(page, promise).not.toContain(promise);
    }
    // Same disclosure the waitlist form, API response and welcome email give.
    expect(page).toContain('does not create an account, issue an invitation, or guarantee access or timing');
  });

  it('derives the journal essay count from the real list instead of a hard-coded number', () => {
    expect(page).not.toMatch(/Explore All \d+ Essays/);
    expect(page).toContain('Explore All {journalEssays.length} Essays');
  });
});
