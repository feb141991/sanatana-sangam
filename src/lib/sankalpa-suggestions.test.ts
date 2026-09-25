import { describe, expect, it } from 'vitest';
import {
  mergePracticeAnchoredSuggestions,
  pickFallbackSuggestions,
} from './sankalpa-suggestions';

describe('Sankalpa suggestion personalization', () => {
  it('changes at least one visible suggestion deterministically for each activity signal', () => {
    const japa = mergePracticeAnchoredSuggestions('japa', ['AI option 1', 'AI option 2', 'AI option 3', 'AI option 4']);
    const nitya = mergePracticeAnchoredSuggestions('nitya', ['AI option 1', 'AI option 2', 'AI option 3', 'AI option 4']);
    expect(japa[0]).toBe(pickFallbackSuggestions('japa', 1)[0]);
    expect(nitya[0]).toBe(pickFallbackSuggestions('nitya', 1)[0]);
    expect(japa[0]).not.toBe(nitya[0]);
  });

  it('preserves AI suggestions when no practice signal is available', () => {
    const ai = ['AI option 1', 'AI option 2', 'AI option 3', 'AI option 4'];
    expect(mergePracticeAnchoredSuggestions(null, ai)).toEqual(ai);
  });

  it('deduplicates AI output against the deterministic anchor and fills with trusted bank entries', () => {
    const anchor = pickFallbackSuggestions('pathshala', 1)[0];
    const result = mergePracticeAnchoredSuggestions('pathshala', [anchor, 'AI option']);
    expect(result).toHaveLength(4);
    expect(result[0]).toBe(anchor);
    expect(new Set(result).size).toBe(4);
  });
});
