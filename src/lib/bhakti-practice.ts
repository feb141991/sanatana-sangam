export const BHAKTI_MANTRAS = [
  {
    value: 'Om Namah Shivaya',
    source: 'Public-domain mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
    audioTrackId: null,
  },
  {
    value: 'Hare Krishna Maha Mantra',
    source: 'Public-domain mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
    audioTrackId: 'kirtana-in-hindi',
  },
  {
    value: 'Sri Ram Jai Ram Jai Jai Ram',
    source: 'Public-domain mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
    audioTrackId: null,
  },
  {
    value: 'Gayatri Mantra',
    source: 'Playable chant available',
    audioState: 'in_app',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gayatri_Mantra_as_it_is.ogg',
    audioTrackId: 'gayatri-mantra-as-it-is',
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
