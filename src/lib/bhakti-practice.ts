export const BHAKTI_MANTRAS = [
  { value: 'Om Namah Shivaya', source: 'Public-domain mantra tradition' },
  { value: 'Hare Krishna Maha Mantra', source: 'Public-domain mantra tradition' },
  { value: 'Sri Ram Jai Ram Jai Jai Ram', source: 'Public-domain mantra tradition' },
  { value: 'Gayatri Mantra', source: 'Traditional chant source required for audio later' },
] as const;

export const MALA_TARGETS = [27, 54, 108] as const;

export function buildMalaShareText(options: {
  mantra: string;
  count: number;
  target: number;
  streak?: number;
}) {
  const streakText = options.streak && options.streak > 0
    ? ` I am on a ${options.streak}-day return rhythm.`
    : '';
  return `I completed ${options.count}/${options.target} japa on ${options.mantra} in Sanatana Sangam.${streakText}`;
}
