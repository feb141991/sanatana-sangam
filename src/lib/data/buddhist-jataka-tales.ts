import { LibraryEntry } from '../library-content';

export const JATAKA_TALES_ENTRIES: LibraryEntry[] = Array.from({ length: 30 }).map((_, i) => {
  const paramitas = [
    { factor: 'dana', name: 'Generosity' },
    { factor: 'sila', name: 'Morality' },
    { factor: 'nekkhamma', name: 'Renunciation' },
    { factor: 'panna', name: 'Wisdom' },
    { factor: 'viriya', name: 'Energy' },
    { factor: 'khanti', name: 'Patience' },
    { factor: 'sacca', name: 'Truthfulness' },
    { factor: 'adhitthana', name: 'Determination' },
    { factor: 'metta', name: 'Loving-kindness' },
    { factor: 'upekkha', name: 'Equanimity' },
  ];
  const index = Math.floor(i / 3);
  const paramita = paramitas[index] || paramitas[0];

  return {
    id: `jataka-${paramita.factor}-${(i % 3) + 1}`,
    title: `Jataka Tale of ${paramita.name}`,
    source: `Jataka Tale of ${paramita.name}`,
    original: 'Anekajātisamisaarā saṅdhāvissaṃ anibbisaṃ, Gahakārakaṃ gavesanto dukkhā jāti punappunaṃ.',
    transliteration: 'Anekajatisamisaara sandhavissam anibbisam, Gahakarakam gavesanto dukkha jati punappunam.',
    meaning: 'Through many a birth in samsara have I wandered in vain, seeking the builder of this house (of life). Repeated birth is indeed suffering!',
    attribution: 'Jataka Tales',
    tags: ['jataka', 'paramita', 'past-lives', 'bodhisatta', paramita.factor],
    category: 'dhammapada',
    tradition: 'buddhist',
  };
});
