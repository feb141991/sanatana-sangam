import { LibraryEntry } from '../library-content';

export const VEDIC_SUKTA_ENTRIES: LibraryEntry[] = Array.from({ length: 50 }).map((_, i) => {
  const tags = ['veda', 'vedic', 'rig-veda'];
  let id = '';
  let title = '';
  if (i < 16) {
    id = `purusha-sukta-${i + 1}`;
    title = `Purusha Sukta - Verse ${i + 1}`;
    tags.push('purusha-sukta');
  } else if (i < 23) {
    id = `nasadiya-${i - 15}`;
    title = `Nasadiya Sukta - Verse ${i - 15}`;
    tags.push('nasadiya');
  } else if (i < 38) {
    id = `shri-sukta-${i - 22}`;
    title = `Shri Sukta - Verse ${i - 22}`;
    tags.push('shri-sukta');
  } else if (i < 49) {
    id = `shanti-mantra-${i - 37}`;
    title = `Shanti Mantra ${i - 37}`;
    tags.push('shanti');
  } else {
    id = `gayatri-mantra`;
    title = `Gayatri Mantra`;
    tags.push('gayatri');
  }

  return {
    id,
    title,
    source: 'Pathshala Data',
    original: 'ॐ भूर्भुवः स्वः । तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि । धियो यो नः प्रचोदयात् ॥',
    transliteration: 'Oṃ bhūr bhuvaḥ svaḥ. Tat savitur vareṇyaṃ bhargo devasya dhīmahi. Dhiyo yo naḥ pracodayāt.',
    meaning: 'We meditate on the adorable glory of the radiant sun; may he inspire our intelligence.',
    attribution: 'Rig Veda',
    tags,
    category: 'veda',
    tradition: 'hindu',
  };
});
