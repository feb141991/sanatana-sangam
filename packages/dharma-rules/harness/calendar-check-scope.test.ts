import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error plain ES module script with no type declarations
import { decide, touchesCalendarCheck } from '../../../scripts/ci/calendar-check-scope.mjs';

const ROOT = resolve(__dirname, '../../..');
const IMPORT = /(?:from\s+|import\s*\(\s*|import\s+|require\(\s*)['"]([^'"]+)['"]/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'dist' || name === 'graphify-out') return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx|mts)$/.test(name) ? [path] : [];
  });
}

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = join(ROOT, 'src', spec.slice(2));
  else if (spec.startsWith('@sangam/')) base = join(ROOT, 'packages', spec.slice(8).split('/')[0], 'src', spec.split('/').slice(2).join('/'));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null;
  const stem = base.replace(/\.(js|mjs)$/, '');
  const candidates = [base, `${stem}.ts`, `${stem}.tsx`, `${stem}.mts`, join(stem, 'index.ts'), join(stem, 'index.tsx')];
  return candidates.find((path) => existsSync(path) && statSync(path).isFile()) ?? null;
}

/** Every repository file the calendar check can reach by following imports. */
function reachableFiles(): string[] {
  const pending = walk(join(ROOT, 'packages/dharma-rules'));
  const seen = new Set<string>();
  while (pending.length > 0) {
    const file = pending.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    if (file.endsWith('.json')) continue;
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const target = resolveImport(file, match[1]);
      if (target) pending.push(target);
    }
  }
  return [...seen].map((file) => relative(ROOT, file));
}

const changed = (files: string[]) => () => files;
const push = { eventName: 'push', base: 'abc', head: 'def' };

describe('calendar check scope', () => {
  it('covers every file the calendar check imports', () => {
    const files = reachableFiles();
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((file) => !touchesCalendarCheck([file]))).toEqual([]);
  });

  it('skips only when the changed files are known and none of them matter', () => {
    expect(decide({ ...push, changedFiles: changed(['public/landing.html', 'docs/a.md']) }).run).toBe(false);
    expect(decide({ ...push, changedFiles: changed(['docs/a.md', 'src/lib/calendar/engine.ts']) }).run).toBe(true);
    expect(decide({ ...push, changedFiles: changed(['supabase/migrations/1.sql']) }).run).toBe(true);
    expect(decide({ ...push, changedFiles: changed(['package-lock.json']) }).run).toBe(true);
    expect(touchesCalendarCheck(['src/lib/calendar-other.ts', 'package.json.bak'])).toBe(false);
  });

  it('runs whenever it cannot tell', () => {
    const list = changed(['docs/a.md']);
    expect(decide({ eventName: 'schedule', base: 'abc', head: 'def', changedFiles: list }).run).toBe(true);
    expect(decide({ eventName: 'workflow_dispatch', base: 'abc', head: 'def', changedFiles: list }).run).toBe(true);
    expect(decide({ ...push, base: '0'.repeat(40), changedFiles: list }).run).toBe(true);
    expect(decide({ ...push, base: '', changedFiles: list }).run).toBe(true);
    expect(decide({ ...push, changedFiles: changed([]) }).run).toBe(true);
    expect(
      decide({
        ...push,
        changedFiles: () => {
          throw new Error('bad revision');
        },
      }).run,
    ).toBe(true);
  });
});
