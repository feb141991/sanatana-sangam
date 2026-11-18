import { describe, expect, it } from 'vitest';
import { groundMandaliQuestion } from './mandali-rag';

describe('Mandali Community Q&A Grounding', () => {
  it('redirects decision-seeking queries according to Rule 14', async () => {
    const res = await groundMandaliQuestion({
      question: 'Which date is best for my wedding next month?',
      language: 'en',
    });

    expect(res.status).toBe('decision_redirect');
    expect(res.isVerified).toBe(true);
    expect(res.guidanceText).toContain('teacher');
    expect(res.disclaimer).toBeTruthy();
  });

  it('grounds philosophical questions with Shastric citations', async () => {
    const res = await groundMandaliQuestion({
      question: 'How do I maintain mental stillness and practice Japa during difficult times?',
      tradition: 'hindu',
    });

    expect(res.status).toBe('grounded');
    expect(res.guidanceText).toBeTruthy();
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.disclaimer).toBeTruthy();
  });

  it('provides tradition-neutral guidance for universal contemplative questions', async () => {
    const res = await groundMandaliQuestion({
      question: 'What is the significance of the morning twilight for meditation?',
      tradition: 'all',
    });

    expect(res.guidanceText).toBeTruthy();
    expect(res.disclaimer).toContain('Guru');
  });
});
