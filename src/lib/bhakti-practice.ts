export const BHAKTI_MANTRAS = [
  {
    value: 'Om Namah Shivaya',
    source: 'Public-domain mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
  },
  {
    value: 'Hare Krishna Maha Mantra',
    source: 'Public-domain mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
  },
  {
    value: 'Sri Ram Jai Ram Jai Jai Ram',
    source: 'Public-domain mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
  },
  {
    value: 'Gayatri Mantra',
    source: 'Wikimedia Commons source available',
    audioState: 'source_link',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gayatri_Mantra_as_it_is.ogg',
  },
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
