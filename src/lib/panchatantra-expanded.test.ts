import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MORE_PANCHATANTRA_STORIES, PANCHATANTRA_STORIES } from './katha-library';

type Entry = { id: string; portrait: string; durationMin: number; body: string[]; bodyHi: string[] };
const doc = JSON.parse(
  readFileSync(resolve(__dirname, '../../packages/dharma-rules/src/stories/panchatantra-expanded.json'), 'utf8'),
) as { reviewStatus: string; entries: Entry[] };

const library = [...PANCHATANTRA_STORIES, ...MORE_PANCHATANTRA_STORIES];
const devanagariShare = (text: string) => {
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  return letters.filter((c) => c >= 'ऀ' && c <= 'ॿ').length / Math.max(1, letters.length);
};

describe('canonical Panchatantra expanded content', () => {
  it('covers exactly the stories in katha-library, once each', () => {
    const ids = doc.entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(library.map((k) => k.id).sort());
  });

  it('keeps English and Hindi paragraph counts equal, at 6 each', () => {
    for (const e of doc.entries) {
      expect(e.body, e.id).toHaveLength(6);
      expect(e.bodyHi, e.id).toHaveLength(6);
      for (const p of [...e.body, ...e.bodyHi]) expect(p.trim().length, e.id).toBeGreaterThan(0);
    }
  });

  it('writes Hindi in Devanagari rather than a copy of the English', () => {
    for (const e of doc.entries) expect(devanagariShare(e.bodyHi.join(' ')), e.id).toBeGreaterThan(0.7);
  });

  it('gives every story a single-emoji portrait and a sane duration', () => {
    for (const e of doc.entries) {
      expect(/[A-Za-z0-9]/.test(e.portrait), `${e.id} portrait`).toBe(false);
      expect(e.portrait.length, `${e.id} portrait`).toBeGreaterThan(0);
      expect(e.portrait.length, `${e.id} portrait`).toBeLessThanOrEqual(8);
      expect(Number.isInteger(e.durationMin) && e.durationMin >= 1 && e.durationMin <= 15, e.id).toBe(true);
    }
  });

  it('only carries the fields it owns, so title and moral stay canonical in katha-library', () => {
    for (const e of doc.entries) {
      expect(Object.keys(e).sort(), e.id).toEqual(['body', 'bodyHi', 'durationMin', 'id', 'portrait']);
    }
  });

  it('does not claim a review that has not happened', () => {
    expect(doc.reviewStatus).toBe('structure_verified_names_pending_review');
    expect(JSON.stringify(doc)).not.toMatch(/council_reviewed|founder:/);
  });

  it('has a Hindi title and moral for every story, which the offline snapshot depends on', () => {
    for (const k of library) {
      expect(k.titleHi, k.id).toBeTruthy();
      expect(k.phalHi, k.id).toBeTruthy();
    }
  });
});
