import { describe, expect, it } from 'vitest';
import { rankOfFirstExpected, summariseRetrieval } from './retrieval-eval-metrics';

describe('rankOfFirstExpected', () => {
  it('returns the 1-based position of the first accepted id', () => {
    expect(rankOfFirstExpected(['a', 'b', 'c'], ['c'])).toBe(3);
    expect(rankOfFirstExpected(['a', 'b', 'c'], ['c', 'b'])).toBe(2);
  });

  it('returns null when no accepted id is retrieved', () => {
    expect(rankOfFirstExpected(['a', 'b'], ['z'])).toBeNull();
    expect(rankOfFirstExpected([], ['a'])).toBeNull();
  });
});

describe('summariseRetrieval', () => {
  it('counts hits at each cutoff and averages reciprocal rank with misses as zero', () => {
    const summary = summariseRetrieval([{ rank: 1 }, { rank: 2 }, { rank: 4 }, { rank: null }]);
    expect(summary).toEqual({ cases: 4, hit1: 1, hit3: 2, hit5: 3, mrr: Number(((1 + 0.5 + 0.25) / 4).toFixed(3)) });
  });

  it('handles an empty run without dividing by zero', () => {
    expect(summariseRetrieval([])).toEqual({ cases: 0, hit1: 0, hit3: 0, hit5: 0, mrr: 0 });
  });
});
