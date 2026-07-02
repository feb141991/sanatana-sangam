export const RANK_META = {
  Seeker:  { emoji: '🌱', color: 'rgba(100,140,100,0.20)',  border: 'rgba(100,160,100,0.35)', text: '#7aab7a',  desc: 'Beginning the journey' },
  Jigyasu: { emoji: '📖', color: 'rgba(180,140,80,0.20)',   border: 'rgba(180,140,80,0.40)',  text: '#c8a050',  desc: 'Curious learner' },
  Shishya: { emoji: '🪔', color: 'rgba(197, 160, 89,0.22)',   border: 'rgba(197, 160, 89,0.44)',  text: '#C5A059',  desc: 'Devoted student' },
  Gyani:   { emoji: '🧿', color: 'rgba(100,140,220,0.20)',  border: 'rgba(100,140,220,0.40)', text: '#6a9cd4',  desc: 'Knowledgeable one' },
  Pandit:  { emoji: '🏵️', color: 'rgba(220,180,60,0.22)',  border: 'rgba(220,180,60,0.50)',  text: '#d4b840',  desc: 'Master of tradition' },
} as const;

export type RankKey = keyof typeof RANK_META;

export function computeRank(total: number, accuracy: number): RankKey {
  if (total >= 30 && accuracy >= 80) return 'Pandit';
  if (total >= 15 && accuracy >= 65) return 'Gyani';
  if (total >= 7  && accuracy >= 50) return 'Shishya';
  if (total >= 1)                    return 'Jigyasu';
  return 'Seeker';
}

export function nextRankInfo(rank: RankKey, total: number, accuracy: number) {
  if (rank === 'Pandit') return null;
  const targets: Record<RankKey, { minTotal: number; minAcc: number; next: RankKey }> = {
    Seeker:  { minTotal: 1,  minAcc: 0,  next: 'Jigyasu' },
    Jigyasu: { minTotal: 7,  minAcc: 50, next: 'Shishya' },
    Shishya: { minTotal: 15, minAcc: 65, next: 'Gyani'   },
    Gyani:   { minTotal: 30, minAcc: 80, next: 'Pandit'  },
    Pandit:  { minTotal: 99, minAcc: 99, next: 'Pandit'  },
  };
  const t = targets[rank];
  const questionsNeeded = Math.max(0, t.minTotal - total);
  const accNeeded       = Math.max(0, t.minAcc - accuracy);
  return { next: t.next, questionsNeeded, accNeeded };
}
