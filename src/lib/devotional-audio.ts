export type DevotionalTrack = {
  id: string;
  title: string;
  type: 'chant' | 'stotram' | 'kirtan';
  tradition: 'hindu' | 'sikh' | 'all';
  sourceName: string;
  sourceUrl: string;
  audioUrl: string;
  creator: string;
  licenseLabel: string;
  attributionText: string;
  durationLabel: string;
  approvalStatus: 'approved' | 'provisional';
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
    creator: 'Rameshvar',
    licenseLabel: 'Free Art License source',
    attributionText: 'Gayatri Mantra as it is by Rameshvar via Wikimedia Commons, licensed under the Free Art License.',
    durationLabel: '22s',
    approvalStatus: 'approved',
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
    creator: 'Swami Atmananda',
    licenseLabel: 'Public-domain source',
    attributionText: 'Sanskrit Chanting Guru Stotram by Swami Atmananda via Wikimedia Commons, released as public-domain/CC0 source.',
    durationLabel: '4m 55s',
    approvalStatus: 'approved',
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
    creator: 'Wikimedia Commons uploader',
    licenseLabel: 'Creative Commons source',
    attributionText: 'Kirtana in Hindi via Wikimedia Commons. Final in-app attribution depends on a last license verification pass.',
    durationLabel: 'Unknown',
    approvalStatus: 'provisional',
    inAppPlayback: true,
    note: 'A playable kirtan starter track for a warmer Bhakti feel.',
  },
  {
    id: 'usnidha-sitatapatra',
    title: 'Usnidha Sitatapatra Dharani',
    type: 'chant',
    tradition: 'all',
    sourceName: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Usnidha_Sitatapatra_dharani,_Siddham_chant_and_Buddhist_Sanskrit_mantra_chant_420_590.ogg',
    audioUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Usnidha_Sitatapatra_dharani,_Siddham_chant_and_Buddhist_Sanskrit_mantra_chant_420_590.ogg',
    creator: 'Ven Chan Master Hsuan Hua',
    licenseLabel: 'CC BY-SA 3.0 source',
    attributionText: 'Usnidha Sitatapatra dharani chant clip from Ven Chan Master Hsuan Hua via Wikimedia Commons, licensed under CC BY-SA 3.0.',
    durationLabel: '2m 50s',
    approvalStatus: 'approved',
    inAppPlayback: true,
    note: 'A Buddhist chant option for broader Bhakti and Zen support.',
  },
];
