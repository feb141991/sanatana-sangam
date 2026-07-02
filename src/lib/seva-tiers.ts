export const SEVA_TIERS = [
  { key: 'jigyasu',   label: 'Jigyasu',   sanskrit: 'जिज्ञासु', emoji: '🌱', min: 0,    max: 99,   glow: false },
  { key: 'shishya',   label: 'Shishya',   sanskrit: 'शिष्य',    emoji: '📿', min: 100,  max: 299,  glow: false },
  { key: 'sadhak',    label: 'Sadhak',    sanskrit: 'साधक',     emoji: '🕯️', min: 300,  max: 699,  glow: false },
  { key: 'seva_mitra',label: 'Seva Mitra',sanskrit: 'सेव मित्र',emoji: '⚔️', min: 700,  max: 1499, glow: false },
  { key: 'tapasvi',   label: 'Tapasvi',   sanskrit: 'तपस्वी',   emoji: '🔥', min: 1500, max: 2999, glow: false },
  { key: 'rishi',     label: 'Rishi',     sanskrit: 'ऋषि',      emoji: '🏔️', min: 3000, max: 5999, glow: true  },
  { key: 'mahatma',   label: 'Mahatma',   sanskrit: 'महात्मा',  emoji: '✨', min: 6000, max: Infinity, glow: true },
] as const;

export type TierKey = typeof SEVA_TIERS[number]['key'];

export function getTierFromScore(sevaScore: number) {
  return [...SEVA_TIERS].reverse().find(t => sevaScore >= t.min) ?? SEVA_TIERS[0];
}

export function getNextTier(sevaScore: number) {
  const current = getTierFromScore(sevaScore);
  const idx = SEVA_TIERS.findIndex(t => t.key === current.key);
  return idx < SEVA_TIERS.length - 1 ? SEVA_TIERS[idx + 1] : null;
}

export function getProgressToNextTier(sevaScore: number) {
  const current = getTierFromScore(sevaScore);
  const next = getNextTier(sevaScore);
  if (!next) return 100;
  const range = next.min - current.min;
  const earned = sevaScore - current.min;
  return Math.round((earned / range) * 100);
}
