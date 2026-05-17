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
    audioState: 'in_app',
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
  {
    value: 'Om Namo Bhagavate Vasudevaya',
    source: 'Public-domain Vaishnava mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
    audioTrackId: null,
  },
  {
    value: 'Om Gam Ganapataye Namah',
    source: 'Public-domain Ganesha mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
    audioTrackId: null,
  },
  {
    value: 'Waheguru',
    source: 'Sikh Naam Simran tradition',
    audioState: 'focus_only',
    sourceUrl: null,
    audioTrackId: null,
  },
  {
    value: 'Om Mani Padme Hum',
    source: 'Buddhist compassion mantra tradition',
    audioState: 'in_app',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Usnidha_Sitatapatra_dharani,_Siddham_chant_and_Buddhist_Sanskrit_mantra_chant_420_590.ogg',
    audioTrackId: 'usnidha-sitatapatra',
  },
  {
    value: 'Namokar Mantra',
    source: 'Jain Navkar mantra tradition',
    audioState: 'focus_only',
    sourceUrl: null,
    audioTrackId: null,
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
  return `I completed ${options.count}/${options.target} japa on ${options.mantra} in Shoonaya.${streakText}`;
}
