import { LibraryEntry } from '../library-content';

export const EIGHTFOLD_PATH_ENTRIES: LibraryEntry[] = Array.from({ length: 30 }).map((_, i) => {
  const pathFactors = [
    { factor: 'right-view', name: 'Right View', tag: 'wisdom' },
    { factor: 'right-intention', name: 'Right Intention', tag: 'wisdom' },
    { factor: 'right-speech', name: 'Right Speech', tag: 'ethics' },
    { factor: 'right-action', name: 'Right Action', tag: 'ethics' },
    { factor: 'right-livelihood', name: 'Right Livelihood', tag: 'ethics' },
    { factor: 'right-effort', name: 'Right Effort', tag: 'meditation' },
    { factor: 'right-mindfulness', name: 'Right Mindfulness', tag: 'meditation' },
    { factor: 'right-concentration', name: 'Right Concentration', tag: 'meditation' },
  ];
  const index = Math.min(Math.floor(i / 4), 7);
  const path = pathFactors[index];

  return {
    id: `path-${path.factor}-${(i % 4) + 1}`,
    title: `Noble Eightfold Path - ${path.name}`,
    source: `Noble Eightfold Path - ${path.name}`,
    original: 'Ayam eva ariyo aṭṭhaṅgiko maggo, seyyathidaṃ: sammādiṭṭhi sammāsaṅkappo sammāvācā sammākammanto sammā-ājīvo sammāvāyāmo sammāsati sammāsamādhi.',
    transliteration: 'Ayam eva ariyo atthangiko maggo, seyyathidam: sammaditthi sammasankappo sammavaca sammakammanto samma-ajivo sammavayamo sammasati sammasamadhi.',
    meaning: 'This is the Noble Eightfold Path; that is, right view, right intention, right speech, right action, right livelihood, right effort, right mindfulness, right concentration.',
    attribution: 'Dhammacakkappavattana Sutta',
    tags: ['eightfold-path', 'middle-way', path.factor, path.tag],
    category: 'buddhist_foundations',
    tradition: 'buddhist',
  };
});
