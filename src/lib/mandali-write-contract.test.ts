import { describe, expect, it } from 'vitest';
import { parseMandaliCommentInput, parseMandaliPostInput } from './mandali-write-contract';

describe('Mandali write contract', () => {
  it('normalizes valid post and comment payloads', () => {
    expect(parseMandaliPostInput({ content: '  Namaste  ', postType: 'update' })).toEqual({
      content: 'Namaste', postType: 'update', eventDate: null, eventLocation: null,
    });
    expect(parseMandaliCommentInput({ postId: 'p1', body: '  Sat Sri Akal  ' })).toEqual({
      postId: 'p1', body: 'Sat Sri Akal', parentId: null,
    });
  });

  it('fails closed for unknown types, malformed dates, and oversized content', () => {
    expect(parseMandaliPostInput({ content: 'x', postType: 'admin' })).toBeNull();
    expect(parseMandaliPostInput({ content: 'x', postType: 'event', eventDate: 'not-a-date' })).toBeNull();
    expect(parseMandaliPostInput({ content: 'x'.repeat(2_001), postType: 'update' })).toBeNull();
    expect(parseMandaliCommentInput({ postId: 'p1', body: 'x'.repeat(1_001) })).toBeNull();
  });
});
