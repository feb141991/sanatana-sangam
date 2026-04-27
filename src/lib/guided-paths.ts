export type GuidedPathStatus = 'active' | 'dismissed' | 'completed';

export interface GuidedPathProgressRow {
  path_id: string;
  status: GuidedPathStatus;
  started_at?: string | null;
  completed_at: string | null;
  updated_at: string;
  day_reached?: number;
}

export function buildGuidedPathStatusMap(rows: GuidedPathProgressRow[]) {
  return rows.reduce<Record<string, GuidedPathStatus>>((acc, row) => {
    acc[row.path_id] = row.status;
    return acc;
  }, {});
}

// ─── Plan definitions ──────────────────────────────────────────────────────────
export type PlanTradition = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
export type PlanDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GuidedPlanDay {
  day: number;
  title: string;
  focus: string;        // brief focus label
  practice: string;     // what to do
  duration: number;     // minutes
}

export interface GuidedPlan {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  duration: number;       // days
  tradition: PlanTradition;
  difficulty: PlanDifficulty;
  description: string;
  tagline: string;
  accentColor: string;
  borderColor: string;
  days: GuidedPlanDay[];
}

// ─── 7-day plans ──────────────────────────────────────────────────────────────
export const GUIDED_PLANS: GuidedPlan[] = [
  {
    id: 'brahma-muhurta-7',
    title: 'Brahma Muhurta Immersion',
    subtitle: '7-Day Dincharya Onboarding',
    emoji: '🌅',
    duration: 7,
    tradition: 'all',
    difficulty: 'beginner',
    tagline: 'Build your Dincharya one step at a time — wake up, add one practice, repeat.',
    description: 'This plan teaches the 7-step Dincharya (daily routine) by adding one new practice each morning. Day 1 you only wake up early. Day 2 you add Snana. Day 3, Tilak. By Day 7 you are doing all 7 steps in sequence — the full Nitya Karma routine — as one flowing practice. Start here if the full routine feels overwhelming.',
    accentColor: '#C8924A',
    borderColor: 'rgba(200,146,74,0.22)',
    days: [
      { day: 1, title: 'The Sacred Rise',      focus: 'Waking ✦ Step 1',        practice: 'Set your alarm for Brahma Muhurta (90 minutes before sunrise). When it rings, sit upright in bed and say your deity\'s name or chosen mantra three times before touching your phone. That is all for today.', duration: 5 },
      { day: 2, title: 'Snana Added',          focus: 'Purification ✦ Step 2',  practice: 'Wake at Brahma Muhurta (step 1 ✓). Now add: cold or cool water snana (bath) with intention. Before entering the water, set one sankalpa — one purpose — for this day.', duration: 15 },
      { day: 3, title: 'Tilak & Identity',     focus: 'Awakening ✦ Step 3',     practice: 'Wake + Snana (steps 1–2 ✓). Now add: apply tilak or simran. Stand before the mirror for two minutes and consciously recall your dharmic identity — who you are beyond the roles you play.', duration: 20 },
      { day: 4, title: 'Japa Begins',          focus: 'Mantra ✦ Step 4',        practice: 'Wake + Snana + Tilak (steps 1–3 ✓). Now add: one full mala (108 rounds) of your chosen mantra. Sit, close your eyes, and begin before any screen or conversation.', duration: 35 },
      { day: 5, title: 'Sandhya Vandana',      focus: 'Prayer ✦ Step 5',        practice: 'Steps 1–4 ✓. Now add: morning Sandhya Vandana or Surya Namaskar. Turn toward the east and greet the rising sun with the full sequence. If you don\'t know the full form, offer a simple arghya (water in cupped hands lifted toward the sun).', duration: 45 },
      { day: 6, title: 'Shloka Paath',         focus: 'Scripture ✦ Step 6',     practice: 'Steps 1–5 ✓. Now add: read or recite one passage from your chosen scripture. It may be a single shloka or one chapter. Choose one verse to carry in your mind through the day.', duration: 55 },
      { day: 7, title: 'Full Nitya Karma',     focus: 'All 7 Steps ✦ Complete', practice: 'Today you do the complete Dincharya in one flowing sequence: (1) Rise at Brahma Muhurta, (2) Snana, (3) Tilak, (4) Japa — one mala, (5) Sandhya Vandana, (6) Shloka Paath, (7) Aarti or silent offering to your deity. No shortcuts. This is your morning from today onward.', duration: 75 },
    ],
  },
  {
    id: 'japa-foundation-7',
    title: 'Japa Foundation',
    subtitle: '7-Day Mantra Practice',
    emoji: '📿',
    duration: 7,
    tradition: 'all',
    difficulty: 'beginner',
    tagline: 'Anchor your mind in one sacred sound.',
    description: 'Seven days of deepening japa practice — from restless mind to focused devotion. Each session builds concentration and reveals the mantra\'s inner depth.',
    accentColor: '#b07ad4',
    borderColor: 'rgba(160,100,220,0.22)',
    days: [
      { day: 1, title: 'Choose Your Mantra',   focus: 'Selection',    practice: 'Choose one mantra and sit with it for 10 minutes. Notice where the mind wanders without judgment.', duration: 10 },
      { day: 2, title: 'One Mala',             focus: 'Continuity',   practice: 'Complete one full mala (108 rounds) without interruption. If you lose count, start again.', duration: 20 },
      { day: 3, title: 'Before Sunrise',       focus: 'Timing',       practice: 'Complete your mala before sunrise or before any screen time. Notice the quality of silence.', duration: 20 },
      { day: 4, title: 'Breath and Bead',      focus: 'Integration',  practice: 'Synchronise one repetition per exhale. Slow the breath slightly — let mantra and prana merge.', duration: 25 },
      { day: 5, title: 'Two Malas',            focus: 'Deepening',    practice: 'Sit for two continuous malas. In the second, notice if the mind has softened.', duration: 40 },
      { day: 6, title: 'Silent Mantra',        focus: 'Internalisaton',practice: 'Do one mala aloud, one mental (ajapa). Feel the mantra arise without effort.', duration: 40 },
      { day: 7, title: 'Japa & Sankalpa',      focus: 'Dedication',   practice: 'Three malas. After the last bead, sit in silence and dedicate the merit to all beings.', duration: 60 },
    ],
  },
  {
    id: 'bhakti-awakening-7',
    title: 'Bhakti Awakening',
    subtitle: '7-Day Heart Opening',
    emoji: '🪔',
    duration: 7,
    tradition: 'hindu',
    difficulty: 'beginner',
    tagline: 'Open the heart. Let devotion become a daily act.',
    description: 'Seven days of devotional practice through kirtan, aarti, and bhajan. Each day builds on the last until bhakti flows naturally throughout your day.',
    accentColor: '#d4643a',
    borderColor: 'rgba(212,100,58,0.22)',
    days: [
      { day: 1, title: 'Lighting the Lamp',    focus: 'Aarti',       practice: 'Light a diya and offer aarti to your ishta devata. Sing or recite one simple aarti.', duration: 10 },
      { day: 2, title: 'One Stotra',           focus: 'Stotra',      practice: 'Learn and recite one stotra for your chosen deity. Memorise at least the first verse.', duration: 15 },
      { day: 3, title: 'Morning Bhajan',       focus: 'Kirtan',      practice: 'Begin the day with one bhajan — either sung aloud or with headphones. Let the sound fill the room.', duration: 15 },
      { day: 4, title: 'Pushpa Puja',          focus: 'Puja',        practice: 'Offer flowers or tulsi to your murti or altar with each name of the deity.', duration: 20 },
      { day: 5, title: 'Devotional Reading',   focus: 'Sravana',     practice: 'Read one story of your deity from the Puranas or a bhakti text. Let it nourish the heart.', duration: 20 },
      { day: 6, title: 'Navavidha Bhakti',     focus: 'Understanding',practice: 'Study the nine limbs of bhakti. Choose one to embody fully today — sravana, kirtana, or smarana.', duration: 20 },
      { day: 7, title: 'Full Devotional Day',  focus: 'Immersion',   practice: 'Weave bhakti into every activity today — morning aarti, naam japa during work, evening kirtan.', duration: 60 },
    ],
  },
  {
    id: 'sadhana-foundation-21',
    title: 'Sādhana Foundation',
    subtitle: '21-Day Complete Practice',
    emoji: '🧘',
    duration: 21,
    tradition: 'all',
    difficulty: 'intermediate',
    tagline: 'Twenty-one days to build a practice that lasts a lifetime.',
    description: 'The Vedic tradition says: twenty-one days builds a samskara. This path takes you through three weeks of progressively deepening practice — from outer ritual to inner stillness.',
    accentColor: '#6aafcc',
    borderColor: 'rgba(106,175,204,0.22)',
    days: [
      // Week 1 — Outer rituals
      { day: 1,  title: 'Setting the Sankalpa', focus: 'Intention',   practice: 'Write your sankalpa for the 21 days. What will this practice build in you? Offer it at your altar.', duration: 20 },
      { day: 2,  title: 'Morning Sequence',      focus: 'Routine',     practice: 'Complete your full Nitya Karma sequence. Take note of which step feels most foreign.', duration: 60 },
      { day: 3,  title: 'Body Purification',     focus: 'Saucha',      practice: 'Cold snana, clean clothes. Begin the day with complete physical purity and notice its effect.', duration: 20 },
      { day: 4,  title: 'Mantra Foundation',     focus: 'Japa',        practice: 'One mala of your chosen mantra, seated and still, before any activity.', duration: 25 },
      { day: 5,  title: 'Sandhya Practice',      focus: 'Prayer',      practice: 'Sandhya Vandana or Surya Namaskar at sunrise. Five rounds minimum.', duration: 25 },
      { day: 6,  title: 'Scripture Study',       focus: 'Svadhyaya',   practice: 'Read one chapter from Bhagavad Gita or your tradition\'s primary text. Journal one insight.', duration: 30 },
      { day: 7,  title: 'Week 1 Integration',    focus: 'Review',      practice: 'Repeat the full sequence. Which step has deepened? Which still feels mechanical? Write it down.', duration: 60 },
      // Week 2 — Deepening
      { day: 8,  title: 'Silence Morning',       focus: 'Mauna',       practice: 'Observe complete mauna for the first two hours after waking. Practice in silence.', duration: 120 },
      { day: 9,  title: 'Two Malas',             focus: 'Japa depth',  practice: 'Extend japa to two malas. Notice if the quality of the second differs from the first.', duration: 45 },
      { day: 10, title: 'Sattvic Eating',        focus: 'Ahara',       practice: 'Eat only sattvic food today. Notice how it affects your practice energy in the evening.', duration: 30 },
      { day: 11, title: 'Pranayama Entry',       focus: 'Prana',       practice: 'Add 10 minutes of Nadi Shodhana before japa. Alternate nostril breathing, slow and steady.', duration: 35 },
      { day: 12, title: 'Bhakti Day',            focus: 'Devotion',    practice: 'Let every action today be an offering. Before each task, silently dedicate it to the divine.', duration: 60 },
      { day: 13, title: 'Deeper Scripture',      focus: 'Manana',      practice: 'Read yesterday\'s chapter again. Let it sit in the mind. What emerges in contemplation?', duration: 30 },
      { day: 14, title: 'Week 2 Integration',    focus: 'Consolidation',practice: 'Full sequence + extended japa + pranayama. Note what has shifted in two weeks.', duration: 90 },
      // Week 3 — Inner stillness
      { day: 15, title: 'Meditation Entry',      focus: 'Dhyana',      practice: 'After japa, sit for 10 minutes in complete stillness. Watch thoughts without following them.', duration: 45 },
      { day: 16, title: 'Nididhyasana',          focus: 'Contemplation',practice: 'Take one shloka or teaching. Sit with it for 20 minutes in deep contemplation — not analysis.', duration: 40 },
      { day: 17, title: 'Sankalpa Deepening',    focus: 'Will',        practice: 'Return to your original sankalpa. Has it evolved? Rewrite it with what you now know.', duration: 20 },
      { day: 18, title: 'Full Sattvic Day',      focus: 'Sattva',      practice: 'Sattvic food, mauna for two hours, three malas, evening aarti. Complete sattvic immersion.', duration: 90 },
      { day: 19, title: 'Extended Silence',      focus: 'Stillness',   practice: 'Practice mauna from waking until midday. Let the mind quieten before engaging the world.', duration: 120 },
      { day: 20, title: 'Gratitude Practice',    focus: 'Bhakti',      practice: 'Begin your practice with 10 minutes of sincere gratitude. Name what you are grateful for.', duration: 60 },
      { day: 21, title: '21-Day Completion',     focus: 'Samarpana',   practice: 'Complete the full sequence with double japa. Offer a sankalpa of continuation. The samskara is formed.', duration: 90 },
    ],
  },
  {
    id: 'svadhyaya-21',
    title: 'Svādhyāya Deep Study',
    subtitle: '21-Day Scripture Journey',
    emoji: '📖',
    duration: 21,
    tradition: 'all',
    difficulty: 'intermediate',
    tagline: 'Let the rishis speak. Let their words reshape your mind.',
    description: 'Twenty-one days of structured scriptural study — one chapter or passage per day, with contemplation and journalling. Builds the habit of daily svadhyaya.',
    accentColor: '#6ab87a',
    borderColor: 'rgba(106,184,122,0.22)',
    days: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      title: `Day ${i + 1} — Study & Contemplation`,
      focus: i < 7 ? 'Foundation' : i < 14 ? 'Deepening' : 'Integration',
      practice: i < 7
        ? `Read Chapter ${i + 1} of your chosen text. Journal one insight that applies to your life today.`
        : i < 14
          ? `Re-read Chapter ${i - 6} with deeper attention. What did you miss the first time? Contemplate one verse.`
          : `Study the relationship between Chapters ${i - 13} and ${i - 6}. How do the teachings build on each other?`,
      duration: 30,
    })),
  },
];

export function getPlanById(id: string): GuidedPlan | undefined {
  return GUIDED_PLANS.find(p => p.id === id);
}

export function getPlansByDuration(days: 7 | 21): GuidedPlan[] {
  return GUIDED_PLANS.filter(p => p.duration === days);
}

export function getPlansByTradition(tradition: string): GuidedPlan[] {
  return GUIDED_PLANS.filter(p => p.tradition === 'all' || p.tradition === tradition);
}
