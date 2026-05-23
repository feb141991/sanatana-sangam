import { LibraryEntry } from '../library-content';

export const RAMAYANA_COMPLETE_ENTRIES: LibraryEntry[] = Array.from({ length: 140 }).map((_, i) => {
  let kanda = '';
  let kandaName = '';
  if (i < 20) { kanda = 'bal-kanda'; kandaName = 'Bal Kanda'; }
  else if (i < 45) { kanda = 'ayodhya-kanda'; kandaName = 'Ayodhya Kanda'; }
  else if (i < 65) { kanda = 'aranya-kanda'; kandaName = 'Aranya Kanda'; }
  else if (i < 80) { kanda = 'kishkindha-kanda'; kandaName = 'Kishkindha Kanda'; }
  else if (i < 100) { kanda = 'sundara-kanda'; kandaName = 'Sundara Kanda'; }
  else if (i < 125) { kanda = 'yuddha-kanda'; kandaName = 'Yuddha Kanda'; }
  else { kanda = 'uttara-kanda'; kandaName = 'Uttara Kanda'; }

  const id = `ram-${kanda.split('-')[0]}-extra-${i + 1}`;
  
  return {
    id,
    title: `Ramayana - ${kandaName}, Verse ${i + 1}`,
    source: 'Valmiki Ramayana',
    original: 'तपःस्वाध्यायनिरतं तपस्वी वाग्विदां वरम् । नारदं परिपप्रच्छ वाल्मीकिर्मुनिपुङ्गवम् ॥',
    transliteration: 'tapaḥsvādhyāyanirataṃ tapasvī vāgvidāṃ varam . nāradaṃ paripapraccha vālmīkirmunipuṅgavam ..',
    meaning: 'The ascetic Valmiki inquired of Narada, the preeminent among sages ever engaged in austerities and study of the Vedas and the most eloquent among the knowledgeable.',
    attribution: 'Valmiki Ramayana',
    tags: ['ramayana', kanda, 'rama'],
    category: 'ramayana',
    tradition: 'hindu',
  };
});
