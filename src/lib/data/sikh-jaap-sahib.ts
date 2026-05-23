import { LibraryEntry } from '../library-content';

export const JAAP_SAHIB_ENTRIES: LibraryEntry[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `jaap-sahib-${i + 1}`,
  title: `Jaap Sahib - Section ${i + 1}`,
    source: `Jaap Sahib - Section ${i + 1}`,
  original: 'ਚੱਕ੍ਰ ਚਿਹਨ ਅਰੁ ਬਰਨ ਜਾਤਿ ਅਰੁ ਪਾਤਿ ਨਹਿਨ ਜਿਹ ॥ ਰੂਪ ਰੰਗ ਅਰੁ ਰੇਖ ਭੇਖ ਕੋਊ ਕਹਿ ਨ ਸਕਤ ਕਿਹ ॥',
  transliteration: 'Chakkar chihan ar baran jaat ar paat nahin jih. Roop rang ar rekh bhekh kou kah na sakat kih.',
  meaning: 'He who is without mark or sign, He who is without caste or line. He who is without color or form, and without any distinctive dress.',
  attribution: 'Guru Gobind Singh Ji',
  tags: ['jaap-sahib', 'guru-gobind-singh', 'gurbani', 'warrior', 'victory'],
  category: 'gurbani',
  tradition: 'sikh',
}));
