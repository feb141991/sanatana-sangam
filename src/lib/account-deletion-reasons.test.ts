import { describe, expect, it } from 'vitest';
import { DELETION_REASONS, describeDeletionFeedback } from './account-deletion-reasons';

describe('describeDeletionFeedback', () => {
  it('maps every canonical id to "Label [id]"', () => {
    expect(DELETION_REASONS.map((r) => describeDeletionFeedback(r.id, undefined)))
      .toEqual(DELETION_REASONS.map((r) => `${r.label} [${r.id}]`));
  });

  it('keeps details only alongside a reason, trimmed and capped at 200 chars', () => {
    expect(describeDeletionFeedback('other', '  too slow on my phone  ')).toBe('Other reason [other] (too slow on my phone)');
    expect(describeDeletionFeedback(undefined, 'orphan detail')).toBeNull();
    expect(describeDeletionFeedback('other', 'x'.repeat(500))).toBe(`Other reason [other] (${'x'.repeat(200)})`);
  });

  it('marks label text from older clients as [unlisted] rather than a canonical reason', () => {
    expect(describeDeletionFeedback('Too many notifications', '')).toBe('Too many notifications [unlisted]');
  });

  it('returns null for missing, blank or non-string reasons', () => {
    for (const value of [undefined, null, '', '   ', 42, { id: 'other' }]) {
      expect(describeDeletionFeedback(value, 'detail')).toBeNull();
    }
  });
});
