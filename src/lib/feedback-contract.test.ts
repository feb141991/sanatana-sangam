import { describe, expect, it } from 'vitest';
import { parseFeedbackInput } from './feedback-contract';

describe('Feedback contract', () => {
  it('normalizes valid feedback payloads', () => {
    const input = {
      category: 'suggestion',
      message: '  It would be wonderful to have audio pronunciations for the Hanuman Chalisa.  ',
      rating: 5,
      email: 'seeker@example.com',
      deviceInfo: { platform: 'ios', version: '1.0.0' },
    };
    expect(parseFeedbackInput(input)).toEqual({
      category: 'suggestion',
      message: 'It would be wonderful to have audio pronunciations for the Hanuman Chalisa.',
      rating: 5,
      email: 'seeker@example.com',
      deviceInfo: { platform: 'ios', version: '1.0.0' },
    });
  });

  it('defaults invalid or unknown category to "other"', () => {
    const input = {
      category: 'unknown_category',
      message: 'Great app experience!',
    };
    const result = parseFeedbackInput(input);
    expect(result?.category).toBe('other');
    expect(result?.message).toBe('Great app experience!');
    expect(result?.rating).toBeNull();
    expect(result?.email).toBeNull();
  });

  it('rejects empty or very short messages', () => {
    expect(parseFeedbackInput({ message: '' })).toBeNull();
    expect(parseFeedbackInput({ message: '  hi ' })).toBeNull();
    expect(parseFeedbackInput(null)).toBeNull();
    expect(parseFeedbackInput('random string')).toBeNull();
  });

  it('clamps and validates ratings strictly to integers 1 through 5', () => {
    expect(parseFeedbackInput({ message: 'Good app', rating: 4.8 })?.rating).toBe(5);
    expect(parseFeedbackInput({ message: 'Good app', rating: 0 })?.rating).toBeNull();
    expect(parseFeedbackInput({ message: 'Good app', rating: 6 })?.rating).toBeNull();
    expect(parseFeedbackInput({ message: 'Good app', rating: -1 })?.rating).toBeNull();
  });

  it('truncates oversized messages to 2000 chars', () => {
    const longMsg = 'A'.repeat(2500);
    const result = parseFeedbackInput({ message: longMsg });
    expect(result?.message.length).toBe(2000);
  });
});
