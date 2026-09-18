import { describe, expect, it } from 'vitest';
import { normalizeQuizPayload } from '@/lib/quiz-normalizer';

describe('normalizeQuizPayload', () => {
  it('normalizes standard valid payload', () => {
    const raw = {
      question: 'What is Dharma?',
      options: ['Cosmic Law', 'Wealth', 'Desire', 'Liberation'],
      answerIndex: 0,
      explanation: 'Dharma signifies cosmic order.',
      fact: 'It is a foundational concept.',
      source: 'Vedas',
    };
    const res = normalizeQuizPayload(raw);
    expect(res).toEqual({
      question: 'What is Dharma?',
      options: ['Cosmic Law', 'Wealth', 'Desire', 'Liberation'],
      answerIndex: 0,
      explanation: 'Dharma signifies cosmic order.',
      fact: 'It is a foundational concept.',
      source: 'Vedas',
    });
  });

  it('handles snake_case answer_index', () => {
    const raw = {
      question: 'What is Karma?',
      options: ['Action', 'Inaction', 'Sleep', 'Dream'],
      answer_index: 0,
      explanation: 'Action and consequence.',
      fact: 'Universal principle.',
      source: 'Upanishads',
    };
    const res = normalizeQuizPayload(raw);
    expect(res?.answerIndex).toBe(0);
  });

  it('handles stringified answer index and letter keys', () => {
    expect(normalizeQuizPayload({
      question: 'Q',
      options: ['1', '2', '3', '4'],
      answerIndex: '2',
    })?.answerIndex).toBe(2);

    expect(normalizeQuizPayload({
      question: 'Q',
      options: ['1', '2', '3', '4'],
      answer: 'C',
    })?.answerIndex).toBe(2);

    expect(normalizeQuizPayload({
      question: 'Q',
      options: ['1', '2', '3', '4'],
      answer: 'B',
    })?.answerIndex).toBe(1);
  });

  it('converts 1-indexed 4 to 3', () => {
    const raw = {
      question: 'Q',
      options: ['1', '2', '3', '4'],
      answerIndex: 4,
    };
    const res = normalizeQuizPayload(raw);
    expect(res?.answerIndex).toBe(3);
  });

  it('normalizes keyed dictionary options', () => {
    const raw = {
      question: 'Q',
      options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
      answerIndex: 1,
    };
    const res = normalizeQuizPayload(raw);
    expect(res?.options).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
    expect(res?.answerIndex).toBe(1);
  });

  it('trims 5 options down to 4', () => {
    const raw = {
      question: 'Q',
      options: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 2,
    };
    const res = normalizeQuizPayload(raw);
    expect(res?.options).toHaveLength(4);
    expect(res?.options).toEqual(['A', 'B', 'C', 'D']);
  });

  it('rejects payloads with missing question or fewer than 4 options', () => {
    expect(normalizeQuizPayload(null)).toBeNull();
    expect(normalizeQuizPayload({ question: '', options: ['1', '2', '3', '4'], answerIndex: 0 })).toBeNull();
    expect(normalizeQuizPayload({ question: 'Q', options: ['1', '2', '3'], answerIndex: 0 })).toBeNull();
    expect(normalizeQuizPayload({ question: 'Q', options: ['1', '2', '3', '4'], answerIndex: 10 })).toBeNull();
  });
});
