export type DevotionalTrack = {
  id: string;
  title: string;
  type: 'chant' | 'stotram' | 'kirtan';
  tradition: 'hindu' | 'sikh' | 'all';
  sourceName: string;
  sourceUrl: string;
  licenseLabel: string;
  inAppPlayback: false;
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
    licenseLabel: 'Free licensed source',
    inAppPlayback: false,
    note: 'A short rights-safe chant source to start the Bhakti audio catalog.',
  },
  {
    id: 'guru-stotram',
    title: 'Guru Stotram',
    type: 'stotram',
    tradition: 'hindu',
    sourceName: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sanskrit_Chanting_Guru_Stotram.ogg',
    licenseLabel: 'Free licensed source',
    inAppPlayback: false,
    note: 'Use the source page for now while the in-app player layer is prepared.',
  },
  {
    id: 'kirtana-in-hindi',
    title: 'Kirtana in Hindi',
    type: 'kirtan',
    tradition: 'all',
    sourceName: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kirtana_in_Hindi.ogg',
    licenseLabel: 'Free licensed source',
    inAppPlayback: false,
    note: 'A starter devotional listening link while we keep rights and attribution explicit.',
  },
];
