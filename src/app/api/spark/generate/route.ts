import { NextResponse } from 'next/server';

// ─── Spark System — Daily Spiritual Insights & Quizzes ────────────────────────
// This endpoint provides tradition-agnostic spiritual facts and quizzes.
// In a production environment, this could be backed by a DB or a CMS.

const DAILY_SPARKS = [
  {
    type: 'fact',
    question: 'The concept of Zero (Shunya)',
    fact: 'The mathematical and philosophical concept of Shunya was developed in ancient India, representing both void and infinite potential.',
    source: 'Ancient Wisdom',
  },
  {
    type: 'quiz',
    question: 'Which of these is the primary virtue of Jainism?',
    options: ['Ahimsa', 'Dana', 'Tapas', 'Svadhyaya'],
    answerIndex: 0,
    explanation: 'Ahimsa (non-violence) is the fundamental vow in Jainism, extending to all living beings.',
    fact: 'Jain monks often carry a small broom to gently brush away tiny insects from their path to avoid harming them.',
    source: 'Jain Philosophy',
  },
  {
    type: 'fact',
    question: 'The Golden Temple (Harmandir Sahib)',
    fact: 'The foundation stone of the Golden Temple was laid by a Sufi saint, Hazrat Mian Mir, signifying the inclusive nature of the Sikh faith.',
    source: 'Sikh History',
  },
  {
    type: 'quiz',
    question: 'What is the literal meaning of "Buddha"?',
    options: ['The King', 'The Awakened One', 'The Silent One', 'The Giver'],
    answerIndex: 1,
    explanation: 'The word Buddha comes from the Sanskrit root "budh", meaning to awaken or to know.',
    fact: 'Siddhartha Gautama became the Buddha at the age of 35 after meditating under the Bodhi tree.',
    source: 'Buddhist Teachings',
  }
];

export async function GET() {
  // Use day of year as a seed to ensure everyone sees the same spark each day
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const spark = DAILY_SPARKS[dayOfYear % DAILY_SPARKS.length];

  return NextResponse.json(spark);
}
