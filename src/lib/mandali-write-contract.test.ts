import { describe, expect, it } from 'vitest';
import { parseMandaliCommentInput, parseMandaliPostInput } from './mandali-write-contract';

describe('Mandali write contract', () => {
  it('normalizes valid post and comment payloads', () => {
    expect(parseMandaliPostInput({ content: '  Namaste  ', postType: 'update' })).toEqual({
      content: 'Namaste', postType: 'update', eventDate: null, eventLocation: null, clientOperationId: null,
    });
    expect(parseMandaliCommentInput({ postId: 'p1', body: '  Sat Sri Akal  ' })).toEqual({
      postId: 'p1', body: 'Sat Sri Akal', parentId: null, clientOperationId: null,
    });
  });

  it('fails closed for unknown types, malformed dates, and oversized content', () => {
    expect(parseMandaliPostInput({ content: 'x', postType: 'admin' })).toBeNull();
    expect(parseMandaliPostInput({ content: 'x', postType: 'event', eventDate: 'not-a-date' })).toBeNull();
    expect(parseMandaliPostInput({ content: 'x'.repeat(2_001), postType: 'update' })).toBeNull();
    expect(parseMandaliCommentInput({ postId: 'p1', body: 'x'.repeat(1_001) })).toBeNull();
  });

  it('accepts a valid clientOperationId and passes it through', () => {
    const opId = '11111111-1111-1111-1111-111111111111';
    expect(parseMandaliPostInput({ content: 'x', postType: 'update', clientOperationId: opId })).toEqual({
      content: 'x', postType: 'update', eventDate: null, eventLocation: null, clientOperationId: opId,
    });
    expect(parseMandaliCommentInput({ postId: 'p1', body: 'x', clientOperationId: opId })).toEqual({
      postId: 'p1', body: 'x', parentId: null, clientOperationId: opId,
    });
  });

  it('fails closed for a malformed clientOperationId instead of silently dropping it', () => {
    expect(parseMandaliPostInput({ content: 'x', postType: 'update', clientOperationId: 'not-a-uuid' })).toBeNull();
    expect(parseMandaliCommentInput({ postId: 'p1', body: 'x', clientOperationId: 'not-a-uuid' })).toBeNull();
  });
});
