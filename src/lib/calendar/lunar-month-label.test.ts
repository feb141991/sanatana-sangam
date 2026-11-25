import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lunarMonthLabel } from './lunar-month-label';

describe('lunarMonthLabel', () => {
  it('gives one name in Shukla paksha and both, marked, in Krishna paksha', () => {
    expect(lunarMonthLabel(new Date('2026-12-20T06:30:00Z'))?.text).toBe('Margashirsha');
    expect(lunarMonthLabel(new Date('2026-11-26T06:30:00Z'))?.text)
      .toBe('Kartika (Amanta) / Margashirsha (Purnimanta)');
  });

  it('names a leap month once and never invents a purnimanta leap name', () => {
    expect(lunarMonthLabel(new Date('2026-05-25T06:30:00Z'))?.text).toBe('Adhika Jyeshtha');
    expect(lunarMonthLabel(new Date('2026-06-10T06:30:00Z'))?.text).toBe('Adhika Jyeshtha (Amanta)');
    expect(lunarMonthLabel(new Date('2026-06-20T06:30:00Z'))?.text).toBe('Jyeshtha');
  });

  it('returns null for an invalid instant instead of a name', () => {
    expect(lunarMonthLabel(new Date('nonsense'))).toBeNull();
  });
});

describe('the legacy solar-derived masaName (D1) is never shown to a person', () => {
  // PanchangWidget is imported by nothing; delete this entry with the file.
  const UNUSED = new Set(['src/components/PanchangWidget.tsx']);

  function tsxFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return tsxFiles(path);
      return path.endsWith('.tsx') ? [path] : [];
    });
  }

  const root = process.cwd();
  const files = tsxFiles(resolve(root, 'src')).map((path) => path.slice(root.length + 1));

  it('no screen or component reads masaName', () => {
    expect(files.length).toBeGreaterThan(300);
    const readers = files.filter((path) => /\bmasaName\b/.test(readFileSync(resolve(root, path), 'utf8')));
    expect(readers.filter((path) => !UNUSED.has(path))).toEqual([]);
  });

  it('the one listed file is still imported by nothing', () => {
    const importers = files.filter((path) => /components\/PanchangWidget['"]|\.\/PanchangWidget['"]/.test(readFileSync(resolve(root, path), 'utf8')));
    expect(importers).toEqual([]);
  });
});
