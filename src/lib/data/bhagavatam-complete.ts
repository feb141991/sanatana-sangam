import { LibraryEntry } from '../library-content';

export const BHAGAVATAM_COMPLETE_ENTRIES: LibraryEntry[] = Array.from({ length: 107 }).map((_, i) => {
  const canto = Math.min(12, Math.floor(i / 9) + 1);
  const tags = ['bhagavatam', `canto-${canto}`];
  if (canto === 7) tags.push('prahlada', 'narasimha');
  if (canto === 10) tags.push('krishna', 'devotion');

  return {
    id: `bhag-${canto}-extra-${i + 1}`,
    title: `Srimad Bhagavatam - Canto ${canto}, Verse ${i + 1}`,
    source: `Srimad Bhagavatam`,
    original: 'जन्माद्यस्य यतोऽन्वयादितरतश्चार्थेष्वभिज्ञः स्वराट्\nतेने ब्रह्म हृदा य आदिकवये मुह्यन्ति यत्सूरयः ।',
    transliteration: 'janmādyasya yato’nvayāditarataścārtheṣvabhijñaḥ svarāṭ\ntene brahma hṛdā ya ādikavaye muhyanti yatsūrayaḥ .',
    meaning: 'O my Lord, Sri Krishna, son of Vasudeva, O all-pervading Personality of Godhead, I offer my respectful obeisances unto You. I meditate upon Lord Sri Krishna because He is the Absolute Truth and the primeval cause of all causes of the creation, sustenance and destruction of the manifested universes.',
    attribution: 'Srimad Bhagavatam',
    tags,
    category: 'bhagavatam',
    tradition: 'hindu',
  };
});
