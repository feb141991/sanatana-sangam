export type DevotionalTrack = {
  id: string;
  title: string;
  type: 'chant' | 'stotram' | 'kirtan';
  tradition: 'hindu' | 'sikh' | 'all';
  sourceName: string;
  sourceUrl: string;
  audioUrl: string;
  licenseLabel: string;
  inAppPlayback: boolean;
  note: string;
};

export const DEVOTIONAL_STARTER_TRACKS: DevotionalTrack[] = [
  {
    id: 'gayatri-mantra-as-it-is',
    title: 'Gayatri Mantra',
    type: 'chant',
    tradition: 'hindu',
    sourceName: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gayatri_Mantra_as_it_is.ogg',
    audioUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gayatri_Mantra_as_it_is.ogg',
    licenseLabel: 'Free Art License source',
    inAppPlayback: true,
    note: 'A playable Gayatri chant for Bhakti, Zen, and Mala.',
  },
  {
    id: 'guru-stotram',
    title: 'Guru Stotram',
    type: 'stotram',
    tradition: 'hindu',
    sourceName: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sanskrit_Chanting_Guru_Stotram.ogg',
    audioUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sanskrit_Chanting_Guru_Stotram.ogg',
    licenseLabel: 'Public-domain source',
    inAppPlayback: true,
    note: 'A playable stotram layer for quieter devotional sessions.',
  },
  {
    id: 'kirtana-in-hindi',
    title: 'Kirtana in Hindi',
    type: 'kirtan',
    tradition: 'all',
    sourceName: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kirtana_in_Hindi.ogg',
    audioUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kirtana_in_Hindi.ogg',
    licenseLabel: 'Creative Commons source',
    inAppPlayback: true,
    note: 'A playable kirtan starter track for a warmer Bhakti feel.',
  },
];
