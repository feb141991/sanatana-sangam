import { describe, expect, it } from 'vitest';
import { adjacentVerseRefs } from './verse-refs';

describe('adjacentVerseRefs', () => {
  it('keeps the chapter for two-part refs', () => {
    expect(adjacentVerseRefs('2.47')).toEqual({ prev: '2.46', next: '2.48' });
  });

  it('keeps adhyaya and valli (or mundaka and khanda) for three-part refs', () => {
    expect(adjacentVerseRefs('1.3.3')).toEqual({ prev: '1.3.2', next: '1.3.4' });
    expect(adjacentVerseRefs('3.1.6')).toEqual({ prev: '3.1.5', next: '3.1.7' });
    expect(adjacentVerseRefs('3.14.1')).toEqual({ prev: null, next: '3.14.2' });
  });

  it('has no previous verse before the first one', () => {
    expect(adjacentVerseRefs('1.1')).toEqual({ prev: null, next: '1.2' });
  });

  it('rejects refs that are not dot-separated integers', () => {
    expect(adjacentVerseRefs('47')).toBeNull();
    expect(adjacentVerseRefs('1.a')).toBeNull();
    expect(adjacentVerseRefs('')).toBeNull();
  });
});
