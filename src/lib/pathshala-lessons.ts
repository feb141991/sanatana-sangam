// ─── Pathshala Lesson Builder — SERVER ONLY ──────────────────────────────────
// This file is intentionally NOT imported by any 'use client' component.
// It lives server-side so the 900 KB of scripture data (gita-full-data +
// library-content) never enters the client JS bundle.

import { GITA_FULL_DATA } from '@/lib/gita-full-data';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';
import type { LibraryEntry } from '@/lib/library-content';

export type Lesson = { title: string; entries: LibraryEntry[] };

const ENTRIES_PER_LESSON = 4;

export function getPathLessons(pathId: string): Lesson[] {
  let entries: LibraryEntry[] = [];

  switch (pathId) {
    case 'bhagavad-gita-intro': {
      const chapters = Array.from({ length: 18 }, (_, i) => i + 1);
      return chapters.map(ch => {
        const tag = `chapter-${ch}`;
        const chEntries = GITA_FULL_DATA.filter(e => (e.tags as readonly string[]).includes(tag));
        return { title: `Chapter ${ch}`, entries: chEntries.slice(0, 8) as unknown as LibraryEntry[] };
      }).filter(l => l.entries.length > 0);
    }

    case 'upanishads-core': {
      const upanishads = ['isha', 'kena', 'katha', 'mandukya'];
      const result: Lesson[] = [];
      for (const name of upanishads) {
        const uEntries = ALL_LIBRARY_ENTRIES.filter(e =>
          e.category === 'upanishad' && e.tags.some(t => t.includes(name))
        );
        for (let i = 0; i < uEntries.length; i += ENTRIES_PER_LESSON) {
          result.push({
            title: `${name.charAt(0).toUpperCase() + name.slice(1)} Upanishad — Part ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
            entries: uEntries.slice(i, i + ENTRIES_PER_LESSON),
          });
        }
      }
      return result.length > 0 ? result : [{ title: 'Upanishad Verses', entries: ALL_LIBRARY_ENTRIES.filter(e => e.category === 'upanishad').slice(0, ENTRIES_PER_LESSON) }];
    }

    case 'stotra-path': {
      const stotraEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'stotra');
      const result: Lesson[] = [];
      for (let i = 0; i < stotraEntries.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Stotra Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: stotraEntries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Daily Stotras', entries: stotraEntries.slice(0, 4) }];
    }

    case 'yoga-sutras': {
      const yogaEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'yoga_sutra');
      const result: Lesson[] = [];
      const yogaChapters = ['samadhi', 'sadhana', 'vibhuti', 'kaivalya'];
      for (const chapter of yogaChapters) {
        const cEntries = yogaEntries.filter(e => e.tags.some(t => t.includes(chapter)));
        for (let i = 0; i < cEntries.length; i += ENTRIES_PER_LESSON) {
          result.push({
            title: `${chapter.charAt(0).toUpperCase() + chapter.slice(1)} Pada — Part ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
            entries: cEntries.slice(i, i + ENTRIES_PER_LESSON),
          });
        }
      }
      return result.length > 0 ? result : [{ title: 'Yoga Sutras', entries: yogaEntries.slice(0, 4) }];
    }

    case 'nitnem-daily': {
      const gurbaniEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'gurbani' || e.category === 'nitnem');
      const result: Lesson[] = [];
      for (let i = 0; i < gurbaniEntries.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Nitnem Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: gurbaniEntries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Nitnem Banis', entries: gurbaniEntries.slice(0, 4) }];
    }

    case 'dhammapada-path': {
      const dhamma = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'dhammapada');
      const result: Lesson[] = [];
      for (let i = 0; i < dhamma.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Chapter ${Math.floor(i / ENTRIES_PER_LESSON) + 1} — Dhammapada`, entries: dhamma.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Dhammapada', entries: dhamma.slice(0, 4) }];
    }

    // ── Hindu — Epic & Puranic ──────────────────────────────────────────────────

    case 'ramayana-bal-kanda': {
      const ram = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'ramayana');
      const result: Lesson[] = [];
      const labels = ['Valmiki & Narada', 'Rama\'s Virtues', 'Exile & Sita', 'Aranya Kanda', 'Lanka & Hanuman', 'Victory & Return', 'The Ideal Kingdom', 'Uttara Kanda'];
      for (let i = 0; i < ram.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Sarga ${idx + 1}`, entries: ram.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Bal Kanda', entries: ram.slice(0, 4) }];
    }

    case 'bhagavatam-canto-1': {
      const bhag = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'bhagavatam');
      const result: Lesson[] = [];
      const labels = ['The Absolute Truth', 'Purpose of Religion', 'Devotion & Dharma', 'Always Think of Krishna', 'The Nature of God', 'Surrender & Liberation'];
      for (let i = 0; i < bhag.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Canto ${idx + 1}`, entries: bhag.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Bhagavatam Foundations', entries: bhag.slice(0, 4) }];
    }

    case 'chanakya-neeti-full': {
      const chanakya = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'chanakya');
      const result: Lesson[] = [];
      const chapters = ['Chapter I — Wisdom & Virtue', 'Chapter II — Leadership', 'Chapter III — Wealth & Conduct', 'Chapter IV — Statecraft', 'Chapter V — Practical Life'];
      for (let i = 0; i < chanakya.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: chapters[idx] ?? `Chapter ${idx + 1}`, entries: chanakya.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Chanakya Neeti', entries: chanakya.slice(0, 4) }];
    }

    case 'shiva-purana-intro': {
      const shaiva = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'shiva_purana' || (e.tradition === 'hindu' && e.tags.some(t => t.includes('shiva') || t.includes('shaiva') || t.includes('linga'))));
      const base = shaiva.length >= 4 ? shaiva : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'hindu' && e.tags.some(t => ['shiva', 'shaiva', 'mahadev', 'rudra', 'parvati'].includes(t)));
      const result: Lesson[] = [];
      const labels = ['Mahadev — The Great God', 'The Linga & Manifestation', 'Parvati & Shakti', 'Destruction & Liberation', 'Shaiva Philosophy'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Part ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Shiva Purana', entries: ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'hindu').slice(0, 4) }];
    }

    case 'devi-mahatmyam-path': {
      const shakta = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'shakta' || e.tags.some(t => ['devi', 'durga', 'shakti', 'kali', 'mahatmyam', 'durga-saptashati'].includes(t)));
      const base = shakta.length >= 4 ? shakta : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'hindu' && e.tags.some(t => ['shakti', 'goddess', 'devi'].includes(t)));
      const result: Lesson[] = [];
      const labels = ['Prathama Charitra — Mahakali', 'Madhyama Charitra — Mahalakshmi', 'Uttama Charitra — Mahasaraswati', 'Devi\'s Boons & Protection', 'The Eternal Goddess'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Charitra ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Devi Mahatmyam', entries: ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'hindu').slice(0, 4) }];
    }

    case 'vedic-suktas-core': {
      const vedic = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'veda' || e.tags.some(t => ['purusha-sukta', 'nasadiya', 'shanti', 'rig-veda', 'veda', 'vedic'].includes(t)));
      const base = vedic.length >= 4 ? vedic : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'hindu' && e.category === 'mantra');
      const result: Lesson[] = [];
      const labels = ['Purusha Sukta', 'Nasadiya Sukta', 'Shanti Mantras', 'Vedic Cosmology', 'Eternal Wisdom'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Sukta ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Vedic Suktas', entries: ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'hindu').slice(0, 4) }];
    }

    case 'ramcharitmanas-bhakti': {
      const ram = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'ramcharitmanas');
      const result: Lesson[] = [];
      const labels = ['Bal Kand — Mangalacharana', 'Hanuman Chalisa', 'Bhakti Dohas', 'Aranya Kand Chaupais', 'Sundara Kand — Devotion', 'Lanka Kand — Victory', 'Uttara Kand — Wisdom'];
      for (let i = 0; i < ram.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Part ${idx + 1}`, entries: ram.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Ramcharitmanas', entries: ram.slice(0, 4) }];
    }

    // ── Sikh Paths ──────────────────────────────────────────────────────────────

    case 'japji-sahib-deep': {
      const sikhEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh' && e.tags.some(t => t.includes('japji') || t === 'mool-mantar' || t === 'waheguru'));
      const base = sikhEntries.length >= 4 ? sikhEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh');
      const result: Lesson[] = [];
      const labels = ['Mool Mantar & Pauris 1–5', 'Pauris 6–11 — Forms of God', 'Pauris 12–18 — Naam', 'Pauris 19–24 — Seva', 'Pauris 25–31 — Hukam', 'Pauris 32–38 — Liberation', 'Shalok — The Seal'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Pauri Group ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Japji Sahib', entries: base.slice(0, 4) }];
    }

    case 'sukhmani-sahib-peace': {
      const sikhEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh' && e.tags.some(t => t === 'sukhmani' || t === 'peace' || t === 'simran'));
      const base = sikhEntries.length >= 4 ? sikhEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh');
      const result: Lesson[] = [];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Ashtpadi ${Math.floor(i / ENTRIES_PER_LESSON) + 1} — Peace & Simran`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Sukhmani Sahib', entries: base.slice(0, 4) }];
    }

    case 'asa-di-var-morning': {
      const sikhEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh' && e.tags.some(t => ['asa-di-var', 'morning', 'congregation'].includes(t)));
      const base = sikhEntries.length >= 2 ? sikhEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh');
      const result: Lesson[] = [];
      const labels = ['Opening Slokas — Dawn', 'Pauries 1–6 — Naam', 'Pauries 7–12 — Seva', 'Pauries 13–18 — Grace', 'Pauries 19–24 — Congregation', 'Closing Slokas — Gratitude'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Asa Di Var', entries: base.slice(0, 4) }];
    }

    case 'jaap-sahib-valour': {
      const sikhEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh' && e.tags.some(t => ['warrior', 'courage', 'guru-gobind-singh', 'victory'].includes(t)));
      const base = sikhEntries.length >= 2 ? sikhEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh');
      const result: Lesson[] = [];
      const labels = ['Verses 1–20 — Divine Names', 'Verses 21–60 — Formless God', 'Verses 61–99 — All-Pervading', 'Verses 100–140 — The Creator', 'Verses 141–199 — The Liberator'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Jaap Sahib', entries: base.slice(0, 4) }];
    }

    case 'chaupai-sahib-protection': {
      const sikhEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh' && e.tags.some(t => ['chaupai-sahib', 'protection', 'strength'].includes(t)));
      const base = sikhEntries.length >= 2 ? sikhEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh');
      const result: Lesson[] = [];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Chaupai — Part ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Chaupai Sahib', entries: base.slice(0, 4) }];
    }

    case 'anand-sahib-bliss': {
      const sikhEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh' && e.tags.some(t => ['anand-sahib', 'bliss', 'joy', 'guru-amar-das'].includes(t)));
      const base = sikhEntries.length >= 2 ? sikhEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh');
      const result: Lesson[] = [];
      const labels = ['Pauris 1–10 — Song of Bliss', 'Pauris 11–20 — The True Guru', 'Pauris 21–30 — Naam Amrit', 'Pauris 31–40 — Liberation', 'Closing Shloka'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Anand Sahib', entries: base.slice(0, 4) }];
    }

    case 'guru-granth-intro':
    case 'sikh-history-gurus':
    case 'zafarnama-victory':
    case 'rehras-sahib-evening': {
      const sikhAll = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'sikh');
      const result: Lesson[] = [];
      const sessionLabels: Record<string, string[]> = {
        'guru-granth-intro':    ['Structure & Raags', 'The Living Guru', 'Unified Message', 'Daily Recitation'],
        'sikh-history-gurus':   ['Guru Nanak Dev Ji', 'Gurus 2–5', 'Gurus 6–9', 'Guru Gobind Singh Ji', 'The Khalsa'],
        'zafarnama-victory':    ['Historical Context', 'Letter of Victory I', 'Letter of Victory II', 'Spiritual Triumph'],
        'rehras-sahib-evening': ['Evening Prayer', 'Charan Kamal', 'Gratitude & Surrender', 'Closing Shabad'],
      };
      const labels = sessionLabels[pathId] ?? [];
      for (let i = 0; i < sikhAll.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: sikhAll.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Gurbani', entries: sikhAll.slice(0, 4) }];
    }

    // ── Buddhist Paths ──────────────────────────────────────────────────────────

    case 'four-noble-truths': {
      const bEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.tags.some(t => ['four-noble-truths', 'dukkha', 'nirvana', 'first-sermon'].includes(t)));
      const base = bEntries.length >= 4 ? bEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist');
      const result: Lesson[] = [];
      const labels = ['First Truth — Dukkha', 'Second Truth — Samudaya', 'Third Truth — Nirodha', 'Fourth Truth — Magga', 'The Noble Eightfold Path', 'Liberation in Practice'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Four Noble Truths', entries: base.slice(0, 4) }];
    }

    case 'eightfold-path-practice': {
      const bEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.tags.some(t => ['eightfold-path', 'middle-way', 'ethics', 'meditation', 'wisdom'].includes(t)));
      const base = bEntries.length >= 4 ? bEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist');
      const result: Lesson[] = [];
      const labels = ['Right View & Intention', 'Right Speech & Action', 'Right Livelihood', 'Right Effort & Mindfulness', 'Right Concentration', 'Integration'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Factor ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Eightfold Path', entries: base.slice(0, 4) }];
    }

    case 'heart-sutra-wisdom': {
      const bEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.tags.some(t => ['heart-sutra', 'prajnaparamita', 'emptiness', 'anatta', 'non-self', 'bodhisattva'].includes(t)));
      const base = bEntries.length >= 2 ? bEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.category === 'sutra');
      const result: Lesson[] = [];
      const labels = ['Form & Emptiness', 'The Bodhisattva Path', 'No Fear, No Hindrance', 'The Great Mantra', 'The Perfection of Wisdom', 'Beyond Duality', 'Integration'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Heart Sutra', entries: base.slice(0, 4) }];
    }

    case 'jataka-tales-morality': {
      const bEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.tags.some(t => ['jataka', 'paramita', 'past-lives', 'morality', 'bodhisatta'].includes(t)));
      const base = bEntries.length >= 2 ? bEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.category === 'dhammapada');
      const result: Lesson[] = [];
      const labels = ['Dana — Generosity', 'Sila — Virtue', 'Nekkhamma — Renunciation', 'Panna — Wisdom', 'Viriya — Energy', 'Khanti — Patience', 'Metta — Loving Kindness', 'Equanimity', 'Truth', 'Resolution'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Tale ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Jataka Tales', entries: base.slice(0, 4) }];
    }

    case 'metta-sutta-love': {
      const bEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.tags.some(t => ['metta', 'loving-kindness', 'compassion', 'all-beings'].includes(t)));
      const base = bEntries.length >= 2 ? bEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist');
      const result: Lesson[] = [];
      const labels = ['Universal Love', 'May All Beings Be Happy', 'Compassion Without Boundary', 'The Radiating Mind', 'Living Metta'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Metta Sutta', entries: base.slice(0, 4) }];
    }

    case 'satipatthana-meditation': {
      const bEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist' && e.tags.some(t => ['mindfulness', 'satipatthana', 'meditation', 'majjhima-nikaya'].includes(t)));
      const base = bEntries.length >= 2 ? bEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist');
      const result: Lesson[] = [];
      const labels = ['Foundation — The Direct Path', 'Body — Breath & Posture', 'Feelings — Pleasant & Unpleasant', 'Mind States — Awareness', 'Mental Objects — Hindrances', 'Mental Objects — Factors', 'Integration'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Foundation ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Satipatthana', entries: base.slice(0, 4) }];
    }

    case 'lotus-sutra-universal':
    case 'diamond-sutra-emptiness':
    case 'buddhist-history-council':
    case 'vinaya-pitaka-ethics': {
      const buddhistAll = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'buddhist');
      const result: Lesson[] = [];
      const sessionLabels: Record<string, string[]> = {
        'lotus-sutra-universal':    ['The One Vehicle', 'Parables & Skill', 'Bodhisattva Vow', 'Eternal Buddha', 'Universal Salvation', 'Bodhisattva Practice'],
        'diamond-sutra-emptiness':  ['The Great Matter', 'No Fixed Dharma', 'Neither Arising Nor Ceasing', 'The Raft Metaphor', 'Emptiness of Self', 'The Diamond Insight', 'Complete Liberation'],
        'buddhist-history-council': ['The First Council', 'The Second Council', 'Ashoka\'s Dharma', 'The Great Schism', 'Mahayana Emergence', 'Spread to Asia'],
        'vinaya-pitaka-ethics':     ['Foundation of Discipline', 'Monastic Rules', 'Lay Ethics', 'Right Conduct', 'Community Harmony', 'The Sangha'],
      };
      const labels = sessionLabels[pathId] ?? [];
      for (let i = 0; i < buddhistAll.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: buddhistAll.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Buddhist Wisdom', entries: buddhistAll.slice(0, 4) }];
    }

    // ── Jain Paths ──────────────────────────────────────────────────────────────

    case 'namokar-mantra-foundation': {
      const jEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain' && e.tags.some(t => ['navkar', 'namokar', 'mantra', 'arihantas', 'siddhas', 'prayer'].includes(t)));
      const base = jEntries.length >= 2 ? jEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain');
      const result: Lesson[] = [];
      const labels = ['The Five-Fold Salutation', 'Namo Arihantanam', 'Namo Siddhanam', 'Namo Ayariyanam', 'Namo Uvajjhayanam', 'Namo Loe Savvasahunam', 'The Destroys All Sin', 'Greatest Mantra', 'Daily Practice'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Namokar Mantra', entries: base.slice(0, 4) }];
    }

    case 'ahimsa-paramo-dharma': {
      const jEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain' && e.tags.some(t => ['ahimsa', 'non-violence', 'mahavir', 'acharanga'].includes(t)));
      const base = jEntries.length >= 2 ? jEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain');
      const result: Lesson[] = [];
      const labels = ['Ahimsa — The Supreme Way', 'In Thought', 'In Word', 'In Deed', 'Towards All Life', 'Satya & Asteya', 'Brahmacharya', 'Aparigraha', 'Ahimsa in Daily Life', 'The Living Vow'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Ahimsa', entries: base.slice(0, 4) }];
    }

    case 'tattvartha-sutra-essence': {
      const jEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain' && e.tags.some(t => ['ratnatraya', 'moksha', 'liberation', 'knowledge', 'conduct', 'tattva'].includes(t)));
      const base = jEntries.length >= 2 ? jEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain');
      const result: Lesson[] = [];
      const labels = ['Sutra 1 — Right Knowledge', 'The Soul (Jiva)', 'Ajiva & Matter', 'Karma Influx', 'Vows & Restraint', 'Stopping Karma', 'Shedding Karma', 'Liberation', 'Seven Tattvas', 'The Complete Path'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Chapter ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Tattvartha Sutra', entries: base.slice(0, 4) }];
    }

    case 'jain-cosmology-intro': {
      const jEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain' && e.tags.some(t => ['cosmology', 'loka', 'soul', 'siddha', 'liberation'].includes(t)));
      const base = jEntries.length >= 2 ? jEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain');
      const result: Lesson[] = [];
      const labels = ['The Loka — Universe', 'Upper World', 'Middle World', 'Lower World', 'The Soul\'s Journey', 'Siddhasila — The Abode', 'Time Cycles', 'Karma & Cosmology', 'Path to Moksha', 'Siddhanta Overview', 'The Living Universe', 'Practical Cosmology'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Jain Cosmology', entries: base.slice(0, 4) }];
    }

    case 'bhaktamara-stotra-devotion': {
      const jEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain' && e.tags.some(t => ['bhaktamar', 'stotra', 'adinath', 'protection', 'devotion'].includes(t)));
      const base = jEntries.length >= 2 ? jEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain');
      const result: Lesson[] = [];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Bhaktamar — Verses ${i + 1}–${i + ENTRIES_PER_LESSON}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Bhaktamar Stotra', entries: base.slice(0, 4) }];
    }

    case 'karma-theory-jainism': {
      const jEntries = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain' && e.tags.some(t => ['karma', 'soul', 'liberation', 'kundakunda'].includes(t)));
      const base = jEntries.length >= 2 ? jEntries : ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain');
      const result: Lesson[] = [];
      const labels = ['The Eight Karmas', 'Asrava — Influx', 'Samvara — Stoppage', 'Nirjara — Shedding', 'The Soul Unbound', 'Karma in Daily Life', 'Spiritual Cleansing', 'The Science of the Soul', 'Living Without Karma', 'The Liberated Soul', 'Nirvana', 'Siddha State', 'Moksha', 'Complete Liberation'];
      for (let i = 0; i < base.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: base.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Jain Karma Theory', entries: base.slice(0, 4) }];
    }

    case 'jain-tirthankara-lives':
    case 'anekantavada-philosophy':
    case 'samayika-equanimity':
    case 'jain-yoga-dhyana':
    case 'kalpa-sutra-scripture': {
      const jainAll = ALL_LIBRARY_ENTRIES.filter(e => e.tradition === 'jain');
      const result: Lesson[] = [];
      const sessionLabels: Record<string, string[]> = {
        'jain-tirthankara-lives':   ['Rishabhdeva — The First', 'Adinath to Neminath', 'Parsvanath — The 23rd', 'Mahavira — The Last Tirthankara', 'Their Common Teaching', 'The Ford-Makers'],
        'anekantavada-philosophy':  ['Many-Sidedness of Truth', 'Syadvada — Seven Predicates', 'Nayavada — Partial Truth', 'Intellectual Humility', 'Anekanta in Daily Life', 'Tolerance as Philosophy', 'Modern Application', 'Beyond Absolutism', 'Truth & Perspective', 'Complete Understanding'],
        'samayika-equanimity':      ['The 48-Minute Practice', 'Soul-Consciousness', 'Equanimity Within', 'Withdrawal from Passions', 'Pratikraman', 'Inner Stillness', 'After Samayika', 'Daily Practice', 'Advanced Equanimity', 'Complete Stillness', 'Liberation Through Samayika', 'The Daily Vow'],
        'jain-yoga-dhyana':         ['Dharma Dhyana', 'Shukla Dhyana', 'Kayotsarga', 'Mantra Yoga', 'The Inner Journey', 'Purification Practices', 'Advanced Meditation', 'Liberation Through Dhyana', 'The Soul Alone', 'Moksha', 'Complete Yoga', 'Integration', 'The Final Step', 'Beyond Practice', 'Siddha State'],
        'kalpa-sutra-scripture':    ['Life of Mahavira', 'Birth & Renunciation', 'The Great Ordeal', 'Omniscience', 'The Sangha', 'Life of Parsvanath', 'The Monastic Code', 'Daily Discipline', 'Sacred Rules', 'The Complete Path', 'Parshva to Mahavira', 'The Eternal Dharma', 'Scripture & Liberation', 'Samavayanga Sutra', 'The Living Agama', 'Eternal Truth', 'Modern Application', 'Complete Study', 'Integration', 'The Kalpa Way'],
      };
      const labels = sessionLabels[pathId] ?? [];
      for (let i = 0; i < jainAll.length; i += ENTRIES_PER_LESSON) {
        const idx = Math.floor(i / ENTRIES_PER_LESSON);
        result.push({ title: labels[idx] ?? `Session ${idx + 1}`, entries: jainAll.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result.length > 0 ? result : [{ title: 'Jain Wisdom', entries: jainAll.slice(0, 4) }];
    }

    default: {
      entries = GITA_FULL_DATA.slice(0, 30) as unknown as LibraryEntry[];
      const result: Lesson[] = [];
      for (let i = 0; i < entries.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: entries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result;
    }
  }
}
