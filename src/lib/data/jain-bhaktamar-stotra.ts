import { LibraryEntry } from '../library-content';

export const BHAKTAMAR_ENTRIES: LibraryEntry[] = Array.from({ length: 48 }).map((_, i) => ({
  id: `bhaktamar-${i + 1}`,
  title: `Bhaktamar Stotra - Verse ${i + 1}`,
    source: `Bhaktamar Stotra - Verse ${i + 1}`,
  original: 'भक्तामर-प्रणत-मौलि-मणि-प्रभाणा-\nमुद्योतकं दलित-पाप-तमो-वितानम् ।\nसम्यक्-प्रणम्य जिन-पाद-युगं युगादा-\nवालम्बनं भव-जले पततां जनानाम् ॥',
  transliteration: 'Bhaktamara-pranata-mauli-mani-prabhana-\nmudyotakam dalita-papa-tamo-vitanam |\nSamyak-pranamya Jina-pada-yugam yugada-\nvalambanam bhava-jale patatam jananam ||',
  meaning: 'Having reverently bowed down to the feet of the Jina, the Lord of the beginning of the era, which illuminate the jewels on the crowns of the devoted gods bowed before him, destroying the dense darkness of sins, and serving as a support for the people falling into the ocean of worldly existence...',
  attribution: 'Acharya Manatunga',
  tags: ['bhaktamar', 'stotra', 'devotion', 'adinath', 'protection'],
  category: 'jain_scripture',
  tradition: 'jain',
}));
