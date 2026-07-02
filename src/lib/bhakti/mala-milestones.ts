export interface MalaVolumeMilestone {
  totalBeads: number;
  /** Current tier name. */
  label: string;
  /** Next tier name, or null once the highest tier is reached. */
  nextLabel: string | null;
  /** Bead count of the next tier, or null at the top. */
  nextAt: number | null;
  /** Progress 0..1 toward the next tier (1 at the top). */
  progress: number;
}

/**
 * Lifetime japa tiers, counted in beads (one bead = one repetition). Thresholds
 * are whole multiples of 108 so each tier lands on a completed round count:
 * 108 (1 mala) → 1,080 (10) → 10,800 (100) → 108,000 (1,000, a purascharana)
 * → 1,080,000 (10,000). Purascharana is the classical "completion" vow.
 */
const MALA_TIERS: ReadonlyArray<{ at: number; label: string }> = [
  { at: 0, label: 'First turn' },
  { at: 108, label: 'First mala' },
  { at: 1080, label: 'Sahasram' },
  { at: 10800, label: 'Ayutam' },
  { at: 108000, label: 'Purascharana' },
  { at: 1080000, label: 'Mahapurascharana' },
];

export function getMalaVolumeMilestone(totalBeads: number): MalaVolumeMilestone {
  const beads = Math.max(0, Math.floor(totalBeads));
  let current = MALA_TIERS[0];
  let next: { at: number; label: string } | null = null;
  for (const tier of MALA_TIERS) {
    if (tier.at <= beads) current = tier;
    else { next = tier; break; }
  }
  const span = next ? next.at - current.at : 1;
  const progress = next ? Math.min(1, Math.max(0, (beads - current.at) / span)) : 1;
  return {
    totalBeads: beads,
    label: current.label,
    nextLabel: next ? next.label : null,
    nextAt: next ? next.at : null,
    progress,
  };
}
