export type GuidedPathStatus = 'active' | 'dismissed' | 'completed';

export interface GuidedPathProgressRow {
  path_id: string;
  status: GuidedPathStatus;
  started_at?: string | null;
  completed_at: string | null;
  updated_at: string;
  day_reached?: number;
  current_lesson?: number;
  completed_lessons?: number[];
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

  // ─── Sikh: Nitnem 7-Day ───────────────────────────────────────────────────────
  {
    id: 'nitnem-foundation-7',
    title: 'Nitnem Foundation',
    subtitle: '7-Day Daily Bani Practice',
    emoji: '☬',
    duration: 7,
    tradition: 'sikh',
    difficulty: 'beginner',
    tagline: 'Anchor each day in Gurbani — the Guru\'s words as living practice.',
    description: 'Seven days of building the Nitnem routine — the five daily prayers that structure a Sikh\'s day from Amrit Vela to evening. Each day adds one bani until you hold the complete sequence.',
    accentColor: '#d4a83a',
    borderColor: 'rgba(212,168,58,0.22)',
    days: [
      { day: 1, title: 'Japji Sahib',        focus: 'Morning · Amrit Vela', practice: 'Rise before sunrise (Amrit Vela). Recite Japji Sahib in its entirety. If you do not know it by heart, read with full attention. Let the Mul Mantar echo in your mind before any worldly thought.', duration: 20 },
      { day: 2, title: 'Jaap Sahib',         focus: 'Names of the Infinite', practice: 'Japji Sahib (day 1 ✓). Now add Jaap Sahib — the recitation of 199 names of Waheguru. Recite slowly, feeling each attribute described.', duration: 30 },
      { day: 3, title: 'Tav Prasad Savaiye', focus: 'Grace',                 practice: 'Japji + Jaap (✓). Add Tav Prasad Savaiye. Notice how it focuses on ego-transcendence — the difference between those who recite and those who embody.', duration: 35 },
      { day: 4, title: 'Chaupai Sahib',      focus: 'Protection & Surrender',practice: 'Morning nitnem (✓). Add Chaupai Sahib — Guru Gobind Singh\'s prayer of protection and surrender. Recite it knowing every syllable is a shield.', duration: 45 },
      { day: 5, title: 'Anand Sahib',        focus: 'Joy',                   practice: 'Complete morning nitnem (✓). Now add Anand Sahib — the Song of Bliss. Read all 40 pauris, or at minimum the first five and last one.', duration: 55 },
      { day: 6, title: 'Rehras & Sohila',    focus: 'Evening & Night',        practice: 'Full morning nitnem (✓). Add Rehras Sahib at sunset and Kirtan Sohila before sleep. Feel how the day is bookmarked by Gurbani.', duration: 65 },
      { day: 7, title: 'Full Nitnem Day',    focus: 'Complete Rhythm',        practice: 'Full Nitnem from Amrit Vela: Japji, Jaap, Tav Prasad, Chaupai, Anand Sahib — then Rehras at evening, Sohila at night. Let this structure become your day\'s dharma.', duration: 75 },
    ],
  },

  // ─── Buddhist: Dhammapada 7-Day ───────────────────────────────────────────────
  {
    id: 'dhammapada-7',
    title: 'Dhammapada Journey',
    subtitle: '7-Day Mindful Study',
    emoji: '☸️',
    duration: 7,
    tradition: 'buddhist',
    difficulty: 'beginner',
    tagline: 'The path of the Dhamma, one verse at a time.',
    description: 'Seven days through the opening chapters of the Dhammapada — the Buddha\'s most direct teaching on the mind, suffering, and liberation. Each day: one chapter, one meditation, one application.',
    accentColor: '#7ab8cc',
    borderColor: 'rgba(122,184,204,0.22)',
    days: [
      { day: 1, title: 'Yamaka Vagga',       focus: 'The Pairs · Mind', practice: 'Read Yamaka Vagga (verses 1–20). Sit for 10 minutes with: "Mind is the forerunner of all actions." What thought arose this morning before anything else? Observe without judgment.', duration: 20 },
      { day: 2, title: 'Appamada Vagga',     focus: 'Heedfulness',       practice: 'Read Appamada Vagga (21–32). Appamada — heedfulness, non-negligence — is called the path to the deathless. Choose one activity today to do with complete attention.', duration: 20 },
      { day: 3, title: 'Citta Vagga',        focus: 'The Mind',          practice: 'Read Citta Vagga (33–43). The Buddha compares the untrained mind to a fish thrown on land. Sit for 15 minutes watching thoughts arise and pass without being swept away.', duration: 25 },
      { day: 4, title: 'Puppha Vagga',       focus: 'Flowers',           practice: 'Read Puppha Vagga (44–59). As a bee takes nectar without harming the flower — this is how we should take from the world. What do you take without harming?', duration: 25 },
      { day: 5, title: 'Bāla Vagga',         focus: 'The Fool',          practice: 'Read Bāla Vagga (60–75). Study the marks of the unwise. Not as criticism of others — as a mirror. Where does your own foolishness still operate?', duration: 25 },
      { day: 6, title: 'Pandita Vagga',      focus: 'The Wise',          practice: 'Read Pandita Vagga (76–89). The wise person is described as a guide and path-shower. Who has been this for you? Sit in gratitude for those who pointed you toward Dhamma.', duration: 30 },
      { day: 7, title: 'Arahanta Vagga',     focus: 'The Arahant',       practice: 'Read Arahanta Vagga (90–99). The Arahant needs no teacher, no path, no goal — they have arrived. Sit in 20 minutes of pure awareness with no technique, no goal, just presence.', duration: 35 },
    ],
  },

  // ─── Jain: Ahimsa & Anuvrat 7-Day ────────────────────────────────────────────
  {
    id: 'ahimsa-foundation-7',
    title: 'Ahimsā Foundation',
    subtitle: '7-Day Non-Violence Practice',
    emoji: '🤲',
    duration: 7,
    tradition: 'jain',
    difficulty: 'beginner',
    tagline: 'Non-violence is not abstention — it is a living, breathing way of seeing.',
    description: 'Seven days of building Ahimsa as an active practice — from thought to word to action. Each day applies one of the Anuvrat vows with full attention, making the path practical and embodied.',
    accentColor: '#a8d87a',
    borderColor: 'rgba(168,216,122,0.22)',
    days: [
      { day: 1, title: 'Samayika',           focus: 'Equanimity',          practice: 'Practice Samayika — 48 minutes of complete equanimity. Sit, close your eyes, and resolve to cause no harm in thought, word, or deed for this time. Do this once today, at your most alert hour.', duration: 48 },
      { day: 2, title: 'Vegetarian Vow',     focus: 'Ahimsa in Eating',    practice: 'For today: no food that was harvested after sunset, no root vegetables, no meat. Reflect before each meal — how many beings touched this food? Eat with awareness and gratitude.', duration: 30 },
      { day: 3, title: 'Satya Day',          focus: 'Truth in Speech',     practice: 'Satya — non-lying — is the second anuvratu. Count today how many times you soften a truth, speak imprecisely, or withhold what should be said. No judgment — only observation.', duration: 20 },
      { day: 4, title: 'Asteya',             focus: 'Non-Stealing',        practice: 'Asteya means not taking what is not given — including time, credit, attention. Today: do not interrupt, do not take more than your portion, do not use anything without permission.', duration: 20 },
      { day: 5, title: 'Brahmacharya',       focus: 'Sense Restraint',     practice: 'One day of sense restraint: limit screen time to 2 hours, eat simply, avoid stimulating content. Observe how the mind responds when its usual inputs are withdrawn.', duration: 30 },
      { day: 6, title: 'Aparigraha',         focus: 'Non-Possessiveness',  practice: 'Identify one thing you cling to — an object, a role, a belief. Sit with the question: "Would I still be whole without this?" You do not need to relinquish it — only see it clearly.', duration: 25 },
      { day: 7, title: 'Full Anuvrat Day',   focus: 'Integration',         practice: 'Today practice all five Anuvratas simultaneously: sattvic food, truthful speech, take nothing not freely given, moderate senses, release attachment to one thing. End with Samayika.', duration: 60 },
    ],
  },

  // ─── Hindu: Pranayama 14-Day ──────────────────────────────────────────────────
  {
    id: 'pranayama-14',
    title: 'Prāṇāyāma Immersion',
    subtitle: '14-Day Breath Mastery',
    emoji: '🌬️',
    duration: 14,
    tradition: 'all',
    difficulty: 'intermediate',
    tagline: 'The breath is the bridge between the body and the mind.',
    description: 'Fourteen days of systematic pranayama practice — from foundational breath awareness through advanced kumbhaka retention. Each week introduces a new technique while deepening what came before.',
    accentColor: '#7abcc8',
    borderColor: 'rgba(122,188,200,0.22)',
    days: [
      // Week 1 — Awareness and Foundation
      { day: 1,  title: 'Natural Breath',        focus: 'Observation',       practice: 'Sit for 15 minutes and simply observe the natural breath without controlling it. Note: depth, rhythm, nostril dominance, pauses. Do not change anything — only see.', duration: 15 },
      { day: 2,  title: 'Abdominal Breathing',   focus: 'Diaphragm',         practice: 'Place one hand on the belly. Breathe so only the belly moves — chest stays still. 20 rounds, then rest. This is the foundation of all pranayama.', duration: 15 },
      { day: 3,  title: 'Three-Part Breath',     focus: 'Full Breath',       practice: 'Fill belly, then ribs, then chest on inhale. Empty chest, ribs, belly on exhale. 20 rounds. This is Dirga Pranayama — learn the complete breath cycle.', duration: 20 },
      { day: 4,  title: 'Nadi Shodhana',         focus: 'Balance',           practice: 'Alternate nostril breathing: inhale left, exhale right, inhale right, exhale left = 1 round. 10 rounds without retention. This balances the ida and pingala nadis.', duration: 20 },
      { day: 5,  title: 'Ujjayi Pranayama',      focus: 'Ocean Breath',      practice: 'Constrict the glottis slightly to create an ocean-wave sound on both inhale and exhale. 15 minutes. This warms the prana and builds inner heat.', duration: 20 },
      { day: 6,  title: 'Bhramari',              focus: 'Humming Bee',       practice: 'Plug the ears with thumbs, eyes with fingers, lips lightly closed. Exhale with a low humming sound — feel the vibration in the skull. 10 rounds. Deeply calming.', duration: 20 },
      { day: 7,  title: 'Week 1 Integration',    focus: 'Review',            practice: 'Full sequence: 5 min Nadi Shodhana + 5 min Ujjayi + 5 min Bhramari. Note how the three techniques feel different in the body and mind.', duration: 20 },
      // Week 2 — Deepening and Retention
      { day: 8,  title: 'Antara Kumbhaka',       focus: 'Inner Retention',   practice: 'In Nadi Shodhana: add a brief hold after the inhale (antara kumbhaka). Ratio 4:2:4:0. Do not strain. Gradually increase the hold over the session.', duration: 25 },
      { day: 9,  title: 'Bahya Kumbhaka',        focus: 'Outer Retention',   practice: 'After a full exhale, hold empty (bahya kumbhaka) for a comfortable count. Do not gasp. Start with 2 seconds and lengthen slowly. 10 rounds.', duration: 25 },
      { day: 10, title: 'Kapalabhati',           focus: 'Skull Shining',     practice: 'Short, sharp exhalations through the nose — the inhale happens passively. 50 rounds, rest, 50 rounds. This cleansing breath purifies the respiratory passages.', duration: 20 },
      { day: 11, title: 'Bhastrika',             focus: 'Bellows Breath',    practice: 'Equal force on inhale and exhale — rapid and powerful. 30 rounds, rest. Follow with 5 minutes of Nadi Shodhana to calm the activated prana.', duration: 25 },
      { day: 12, title: 'Surya Bhedana',         focus: 'Solar Activation',  practice: 'Inhale only through the right nostril, exhale only through the left. 15 rounds. Activates the pingala nadi — warming, energising, solar energy.', duration: 20 },
      { day: 13, title: 'Chandra Bhedana',       focus: 'Lunar Calming',     practice: 'Inhale only through the left nostril, exhale only through the right. 15 rounds. Activates the ida nadi — cooling, calming, lunar energy.', duration: 20 },
      { day: 14, title: 'Full Pranayama Sadhana',focus: 'Complete Practice', practice: 'The complete sequence: 5 min Nadi Shodhana → 5 min Ujjayi with kumbhaka → 50 Kapalabhati → 5 min Bhramari → 10 min Nadi Shodhana with full retention ratio. Sit in stillness afterward.', duration: 45 },
    ],
  },

  // ─── Hindu: Hanuman Chalisa 11-Day ───────────────────────────────────────────
  {
    id: 'hanuman-chalisa-11',
    title: 'Hanuman Chalisa Mastery',
    subtitle: '11-Day Devotional Path',
    emoji: '🚩',
    duration: 11,
    tradition: 'hindu',
    difficulty: 'beginner',
    tagline: 'Forty verses. Eleven days. A practice that lasts a lifetime.',
    description: 'Eleven days to memorise, understand, and internalise the complete Hanuman Chalisa — Tulsidas\'s 40-verse hymn to Hanuman. Each day covers new verses and deepens understanding of the preceding ones.',
    accentColor: '#e07a3a',
    borderColor: 'rgba(224,122,58,0.22)',
    days: [
      { day: 1,  title: 'Doha & Chaupai 1–4',   focus: 'Opening',           practice: 'Learn the opening Doha and first four chaupais. Recite the doha 3 times slowly, then read chaupais 1–4 with the meaning. Sit with one image that emerges from the text.', duration: 20 },
      { day: 2,  title: 'Chaupai 5–8',           focus: 'Devotion',          practice: 'Review day 1 verses, then add chaupais 5–8. Chaupai 5 describes Hanuman\'s speed — contemplate how swiftly the mind of a devotee can reach its Lord.', duration: 20 },
      { day: 3,  title: 'Chaupai 9–12',          focus: 'Service',           practice: 'Review 1–8. Add 9–12. These describe Hanuman\'s service to Ram. Reflect: what is your highest service right now? What are you called to do with full strength?', duration: 25 },
      { day: 4,  title: 'Chaupai 13–16',         focus: 'Strength',          practice: 'Review 1–12. Add 13–16. Chaupai 14 — "tumhare bhajan Ram ko pavai" — shows how devotion to Hanuman leads to Ram. Recite your verses from memory where possible.', duration: 25 },
      { day: 5,  title: 'Chaupai 17–20',         focus: 'Protection',        practice: 'Review 1–16. Add 17–20. These describe Hanuman as protector of bhaktas. List three things you are holding in fear. Offer each one to Hanuman as you recite.', duration: 25 },
      { day: 6,  title: 'Chaupai 21–24',         focus: 'Power',             practice: 'Review 1–20. Add 21–24. Hanuman\'s power to grant boons is described here. What boon — not material, but dharmic — do you seek? State it internally as you recite.', duration: 30 },
      { day: 7,  title: 'Chaupai 25–28',         focus: 'Liberation',        practice: 'Review 1–24. Add 25–28. "Jo satbar path kare" — whoever recites 100 times... The path itself is the liberation. Sit for 10 minutes after recitation in silence.', duration: 30 },
      { day: 8,  title: 'Chaupai 29–32',         focus: 'Wish-Fulfiller',    practice: 'Review 1–28. Add 29–32. Hanuman is called "manokamna puraka" — the fulfiller of mental wishes. What wish would truly serve your dharma? Let that be your sankalpa.', duration: 30 },
      { day: 9,  title: 'Chaupai 33–36',         focus: 'Refuge',            practice: 'Review 1–32. Add 33–36. "Tumhari sharan jo aave" — whoever takes refuge in you... Surrender is the culmination of strength. Recite slowly and feel the refuge.', duration: 30 },
      { day: 10, title: 'Chaupai 37–40 + Doha',  focus: 'Completion',        practice: 'Review 1–36. Add the final chaupais and the closing doha. You now have the complete Chalisa. Recite it in full — you may still need the text. Notice any verses that resonate most.', duration: 35 },
      { day: 11, title: 'Full Recitation × 3',   focus: 'Mastery',           practice: 'Recite the complete Hanuman Chalisa three times without the text (reference only when needed). Light a diya before beginning. Offer each recitation — the first for yourself, the second for your family, the third for all beings.', duration: 45 },
    ],
  },
];

export function getPlanById(id: string): GuidedPlan | undefined {
  return GUIDED_PLANS.find(p => p.id === id);
}

export function getPlansByDuration(days: number): GuidedPlan[] {
  return GUIDED_PLANS.filter(p => p.duration === days);
}

export function getPlansByTradition(tradition: string): GuidedPlan[] {
  return GUIDED_PLANS.filter(p => p.tradition === 'all' || p.tradition === tradition);
}
