// ─── Pathshala seed paths — shared between client component + server queries ──
//
// Kept in a plain (non-'use client') module so server components (e.g. the
// insights page) can import it without pulling in React client code.

export const SEED_PATHS = [
  {
    id: 'bhagavad-gita-intro',
    title: 'Bhagavad Gita — Foundations',
    description: 'The 18 chapters of the Gita distilled into 30 focused lessons. Begin at any chapter.',
    difficulty: 'beginner',
    tradition: 'hindu',
    total_lessons: 30,
    duration_days: 30,
  },
  {
    id: 'upanishads-core',
    title: 'Core Upanishads',
    description: 'Isha, Kena, Katha, Mandukya — the four shortest Upanishads with commentary.',
    difficulty: 'intermediate',
    tradition: 'hindu',
    total_lessons: 20,
    duration_days: 20,
  },
  {
    id: 'stotra-path',
    title: 'Daily Stotra Practice',
    description: 'Learn 7 core stotras by heart — Hanuman Chalisa, Durga Saptashati excerpts, Vishnu Sahasranama.',
    difficulty: 'beginner',
    tradition: 'hindu',
    total_lessons: 14,
    duration_days: 21,
  },
  {
    id: 'yoga-sutras',
    title: 'Patanjali Yoga Sutras',
    description: '196 sutras, 4 chapters — Samadhi, Sadhana, Vibhuti, Kaivalya.',
    difficulty: 'advanced',
    tradition: 'hindu',
    total_lessons: 40,
    duration_days: 40,
  },
  {
    id: 'nitnem-daily',
    title: 'Nitnem — Daily Banis',
    description: 'Five core Gurbani prayers for morning and evening practice.',
    difficulty: 'beginner',
    tradition: 'sikh',
    total_lessons: 10,
    duration_days: 30,
  },
  {
    id: 'dhammapada-path',
    title: 'Dhammapada — 26 Chapters',
    description: "The path of truth — 423 verses on the Buddha's practical teachings.",
    difficulty: 'beginner',
    tradition: 'buddhist',
    total_lessons: 26,
    duration_days: 26,
  },
  {
    id: 'ramayana-bal-kanda',
    title: 'Ramayana — Bal Kanda',
    description: 'The childhood of Rama, the lineage of Ikshvaku, and the marriage to Sita. 77 chapters of the Adi Kavya.',
    difficulty: 'intermediate',
    tradition: 'hindu',
    total_lessons: 30,
    duration_days: 45,
  },
  {
    id: 'bhagavatam-canto-1',
    title: 'Bhagavatam — Canto 1',
    description: 'The creation, the questions of the sages, and the setting of the greatest Purana.',
    difficulty: 'intermediate',
    tradition: 'hindu',
    total_lessons: 19,
    duration_days: 30,
  },
  {
    id: 'chanakya-neeti-full',
    title: 'Chanakya Neeti — Mastery',
    description: 'The 17 chapters of Chanakya\'s strategic and practical wisdom for life and leadership.',
    difficulty: 'beginner',
    tradition: 'hindu',
    total_lessons: 17,
    duration_days: 17,
  },
] as const;

// Array of path IDs — use this to scope guided_path_progress queries so they
// don't pick up NityaKarma guided-plan rows (brahma-muhurta-7, japa-foundation-7…)
// which share the same table.
export const PATHSHALA_PATH_IDS = SEED_PATHS.map(p => p.id) as string[];

export type SeedPath = typeof SEED_PATHS[number];
