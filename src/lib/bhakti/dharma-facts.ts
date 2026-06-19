export interface DharmaFact {
  text: string;
  source?: string;
  /** If set, the fact only shows for these traditions; otherwise it is universal. */
  traditions?: string[];
}

const DHARMA_FACTS: DharmaFact[] = [
  { text: 'A mala holds 108 beads and one meru — the guru bead you never cross.' },
  { text: '108 reads as 1, 0 and 8 — the One, the emptiness, and the infinite.' },
  { text: 'Of the three japa — spoken, whispered and silent — the silent is held highest.' },
  { text: 'The thumb rolls each bead over the middle finger; the index, seat of ego, stays apart.' },
  { text: 'At the meru bead you do not cross over — you turn the mala and begin again.' },
  { text: '108 subtle channels (nadis) are said to meet at the heart.' },
  { text: 'The sun is said to sit 108 sun-widths from the earth — the mala mirrors the cosmos.' },
  { text: 'Each bead is one breath returned to the present.' },
  { text: 'The 108 Upanishads carry the inner heart of the Vedas.', traditions: ['hindu'] },
  { text: 'Repeating a mantra 100,000 times is a purascharana — a vow carried to completion.', traditions: ['hindu'] },
  { text: 'Naam Simran — remembrance of the Name — is the seeker\'s quiet mala.', traditions: ['sikh'] },
  { text: 'Ik Onkar: there is One, and it is without end.', source: 'Mool Mantar', traditions: ['sikh'] },
  { text: 'The 108 beads answer the 108 defilements the mind can know.', traditions: ['buddhist'] },
  { text: 'Mindfulness is simply the next bead, and the next.', traditions: ['buddhist'] },
  { text: 'The Namokar mantra bows to the soul that has conquered itself.', traditions: ['jain'] },
  { text: '108 beads for the 108 virtues of the Panch Parmeshthi.', traditions: ['jain'] },
];

function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

/**
 * Deterministic per-day pick — the reflection is stable through a session and
 * rotates each day. Universal facts always apply; tradition-tagged facts only
 * surface for that tradition.
 */
export function pickDharmaFact(tradition: string): DharmaFact {
  const pool = DHARMA_FACTS.filter((f) => !f.traditions || f.traditions.includes(tradition));
  const list = pool.length > 0 ? pool : DHARMA_FACTS;
  return list[dayOfYear() % list.length];
}
