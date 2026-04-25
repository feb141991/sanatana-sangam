// ─────────────────────────────────────────────────────────────────────────────
// Ashrama — Tradition × Life Stage Data Layer
//
// Four universal life stage keys work across all traditions:
//   brahmacharya | grihastha | vanaprastha | sannyasa
//
// Display names, icons, and duty content are tradition-aware. Sikh users see
// "Grihasthi" not "Grihastha"; Buddhist users see "Upasaka" etc. The key
// stored in the DB is always the universal one.
// ─────────────────────────────────────────────────────────────────────────────

export type LifeStage = 'brahmacharya' | 'grihastha' | 'vanaprastha' | 'sannyasa';

export interface AshramaDuty {
  id:          string;
  icon:        string;
  label:       string;
  description: string;
  minutes?:    number;
}

export interface AshramaMeta {
  key:       LifeStage;
  label:     string;        // tradition-aware name
  subtitle:  string;        // one-line purpose
  ageRange:  string;        // soft guide
  icon:      string;        // glyph
  accent:    string;        // colour for this stage
}

// ── Stage Icons ───────────────────────────────────────────────────────────────
// Each stage has a distinct visual character
const STAGE_ICONS: Record<LifeStage, string> = {
  brahmacharya: '🌱',   // seed — foundation being built
  grihastha:    '🏡',   // home — family and duty
  vanaprastha:  '🌿',   // forest — withdrawal and wisdom
  sannyasa:     '🕊️',  // dove — liberation and peace
};

const STAGE_ACCENTS: Record<LifeStage, string> = {
  brahmacharya: '#7CB9E8',   // sky blue — open, receptive mind
  grihastha:    '#C8924A',   // amber — warmth, responsibility
  vanaprastha:  '#6BAE75',   // forest green — nature, withdrawal
  sannyasa:     '#B8A4C8',   // soft violet — liberation, spirit
};

// ── Tradition-aware stage metadata ───────────────────────────────────────────
const STAGE_META_BY_TRADITION: Record<string, Record<LifeStage, Omit<AshramaMeta, 'key' | 'icon' | 'accent'>>> = {
  hindu: {
    brahmacharya: { label: 'Brahmacharya',  subtitle: 'Student — learn, build, purify',       ageRange: '0–25'  },
    grihastha:    { label: 'Grihastha',      subtitle: 'Householder — work, family, dharma',   ageRange: '25–50' },
    vanaprastha:  { label: 'Vanaprastha',    subtitle: 'Forest Dweller — mentor, withdraw',    ageRange: '50–75' },
    sannyasa:     { label: 'Sannyasa',       subtitle: 'Renunciate — release, liberation',     ageRange: '75+'   },
  },
  sikh: {
    brahmacharya: { label: 'Vidhyarthi',    subtitle: 'Student — Gurbani, Seva, grow',         ageRange: '0–25'  },
    grihastha:    { label: 'Grihasthi',      subtitle: 'Householder — Kirat, Seva, Sangat',     ageRange: '25–50' },
    vanaprastha:  { label: 'Bujurg',         subtitle: 'Elder — guide, deepen, simplify',      ageRange: '50–75' },
    sannyasa:     { label: 'Seva-Mukt',      subtitle: 'Pure service — surrender, liberation', ageRange: '75+'   },
  },
  buddhist: {
    brahmacharya: { label: 'Shravaka',      subtitle: 'Listener — learn, precepts, practice',  ageRange: '0–25'  },
    grihastha:    { label: 'Upasaka',        subtitle: 'Lay practitioner — mindful householder',ageRange: '25–50' },
    vanaprastha:  { label: 'Shraman',        subtitle: 'Elder practitioner — deepen, guide',   ageRange: '50–75' },
    sannyasa:     { label: 'Bhikshu Path',   subtitle: 'Monastic path — full renunciation',    ageRange: '75+'   },
  },
  jain: {
    brahmacharya: { label: 'Shravaka Bal',  subtitle: 'Young lay — study, Anuvrat vows',       ageRange: '0–25'  },
    grihastha:    { label: 'Shravaka',       subtitle: 'Lay householder — vows, family, ahimsa',ageRange: '25–50' },
    vanaprastha:  { label: 'Sravaka Jyestha',subtitle: 'Senior lay — greater vows, guidance',  ageRange: '50–75' },
    sannyasa:     { label: 'Sramana',        subtitle: 'Ascetic — Mahavrat, full renunciation', ageRange: '75+'   },
  },
  other: {
    brahmacharya: { label: 'Student',       subtitle: 'Learn, build foundation, develop',      ageRange: '0–25'  },
    grihastha:    { label: 'Householder',    subtitle: 'Work, family, contribute to society',   ageRange: '25–50' },
    vanaprastha:  { label: 'Elder',          subtitle: 'Mentor, withdraw, deepen wisdom',       ageRange: '50–75' },
    sannyasa:     { label: 'Contemplative',  subtitle: 'Liberation, detachment, inner peace',   ageRange: '75+'   },
  },
};

export function getAshramaMeta(tradition: string, stage: LifeStage): AshramaMeta {
  const byTradition = STAGE_META_BY_TRADITION[tradition] ?? STAGE_META_BY_TRADITION.other;
  const meta        = byTradition[stage];
  return {
    key:      stage,
    icon:     STAGE_ICONS[stage],
    accent:   STAGE_ACCENTS[stage],
    ...meta,
  };
}

export function getAllAshramaStages(tradition: string): AshramaMeta[] {
  const stages: LifeStage[] = ['brahmacharya', 'grihastha', 'vanaprastha', 'sannyasa'];
  return stages.map(s => getAshramaMeta(tradition, s));
}

// ── Ashrama Duties — tradition × life stage ───────────────────────────────────
// 8 duties per stage, adapted per tradition

const DUTIES: Record<string, Record<LifeStage, AshramaDuty[]>> = {

  // ── Hindu ──────────────────────────────────────────────────────────────────
  hindu: {
    brahmacharya: [
      { id: 'study',          icon: '📚', label: 'Svadhyaya',       description: 'Dedicate 1–2 hours to learning — Veda, skills, subjects',         minutes: 90 },
      { id: 'body',           icon: '🤸', label: 'Sharira Raksha',  description: 'Physical practice daily — exercise, yoga, or sport',               minutes: 30 },
      { id: 'guru_seva',      icon: '🙇', label: 'Guru Seva',       description: 'Serve and honour those teaching you — listen more than you speak',  minutes: 20 },
      { id: 'meditation',     icon: '🧘', label: 'Dhyana',          description: 'Sit in stillness 5–10 minutes — clear and anchor the mind',         minutes: 10 },
      { id: 'discipline',     icon: '🎯', label: 'Indriya Nigraha', description: 'Limit distractions — social media, idle company, vices',            minutes: 0  },
      { id: 'skill',          icon: '🛠️', label: 'Kaushalya',       description: 'Learn practical abilities — cooking, finances, a craft',            minutes: 30 },
      { id: 'brahmacharya',   icon: '🌊', label: 'Brahmacharya',    description: 'Practice restraint in food, sleep, speech, and vital energy',       minutes: 0  },
      { id: 'elder_respect',  icon: '🌺', label: 'Pitru Bhakti',    description: 'Seek guidance from parents and elders with genuine humility',       minutes: 15 },
    ],
    grihastha: [
      { id: 'artha',          icon: '💼', label: 'Artha Dharma',    description: 'Work with focus — earn honestly and fulfil family obligations',     minutes: 480 },
      { id: 'family',         icon: '🏡', label: 'Kutumba Raksha',  description: 'Give real time to spouse, children, and aging parents',            minutes: 60  },
      { id: 'excellence',     icon: '⚡', label: 'Svadharma',       description: 'Do your professional work with full excellence — it is Yajna',      minutes: 0   },
      { id: 'finance',        icon: '📊', label: 'Vaitt Prabandhan',description: 'Budget, save, invest wisely — protect the family future',           minutes: 15  },
      { id: 'health',         icon: '🌿', label: 'Arogya',          description: 'Exercise and eat well — energy is the currency of duty',            minutes: 30  },
      { id: 'balance',        icon: '⚖️', label: 'Dharma Santulan', description: 'Work hard but protect family and sacred time',                     minutes: 0   },
      { id: 'community',      icon: '🤝', label: 'Samaj Seva',      description: 'Volunteer, mentor, give back — householder owes society',           minutes: 30  },
      { id: 'future',         icon: '🌅', label: 'Parinamam',       description: 'Prepare for the next stage — save, simplify, share wisdom',        minutes: 15  },
    ],
    vanaprastha: [
      { id: 'handover',       icon: '🌿', label: 'Nivrutti',        description: 'Gradually reduce business responsibilities — hand them over',       minutes: 0   },
      { id: 'mentoring',      icon: '🌳', label: 'Shishya Palan',   description: 'Mentor children, colleagues, community — pass what you know',       minutes: 60  },
      { id: 'shastra',        icon: '📜', label: 'Shastra Paath',   description: 'Study sacred texts deeply — read Upanishads, Gita, Puranas',        minutes: 45  },
      { id: 'simplify',       icon: '🍂', label: 'Aparigraha',      description: 'Reduce possessions, expenses, social complexity',                  minutes: 0   },
      { id: 'deep_practice',  icon: '🧘', label: 'Tapas Vridhi',    description: 'Meditate longer — deepen your sadhana without hurry',              minutes: 45  },
      { id: 'pilgrimage',     icon: '🛕', label: 'Tirtha Yatra',    description: 'Visit sacred places — seek darshan and the company of the wise',    minutes: 0   },
      { id: 'nature',         icon: '🌄', label: 'Prakriti Sanga',  description: 'Long walks, quiet reflection in nature — let the world slow',       minutes: 30  },
      { id: 'disciples',      icon: '🪔', label: 'Guru Bhaav',      description: 'Prepare those who are ready to receive deeper knowledge',           minutes: 30  },
    ],
    sannyasa: [
      { id: 'withdrawal',     icon: '🕊️', label: 'Sarva Tyaga',    description: 'Release career, property, worldly roles — let them go fully',       minutes: 0   },
      { id: 'intensive',      icon: '∞',   label: 'Antar Tapas',    description: 'Meditate 2 or more hours daily — the primary occupation now',       minutes: 120 },
      { id: 'minimal',        icon: '🌾', label: 'Alpa Bhoga',      description: 'Minimal possessions, simple food, bare shelter — voluntary poverty', minutes: 0  },
      { id: 'contemplation',  icon: '📿', label: 'Brahma Vichara',  description: 'Read, recite, and contemplate sacred texts throughout the day',     minutes: 60  },
      { id: 'universal',      icon: '🌍', label: 'Vishva Seva',     description: 'Serve without expectation — help any who come to you',              minutes: 0   },
      { id: 'teach',          icon: '🌞', label: 'Jnana Dana',      description: 'Share wisdom freely with any soul sincere in their seeking',        minutes: 0   },
      { id: 'detach',         icon: '🍃', label: 'Vairagya',        description: 'Practice non-attachment to outcomes, praise, people, results',      minutes: 0   },
      { id: 'moksha_prep',    icon: '🙏', label: 'Moksha Sadhana',  description: 'Focus entirely on liberation — spiritual readiness for the final passage', minutes: 0 },
    ],
  },

  // ── Sikh ───────────────────────────────────────────────────────────────────
  sikh: {
    brahmacharya: [
      { id: 'gurbani_study',  icon: '📚', label: 'Gurbani Vidya',   description: 'Learn from the Guru Granth Sahib — study daily with a teacher',    minutes: 60  },
      { id: 'body',           icon: '🤸', label: 'Tan Raksha',      description: 'Exercise and maintain the body as Waheguru\'s gift',               minutes: 30  },
      { id: 'elder_respect',  icon: '🙇', label: 'Vadyan Di Seva',  description: 'Honour parents and teachers with humility — listen before speaking', minutes: 20 },
      { id: 'simran',         icon: '🧘', label: 'Naam Simran',     description: 'Sit in stillness and remember Waheguru — 5 to 10 minutes',         minutes: 10  },
      { id: 'discipline',     icon: '🎯', label: 'Indriya Sanyam',  description: 'Limit vices and distractions — keep company of Sadh Sangat',       minutes: 0   },
      { id: 'skill',          icon: '🛠️', label: 'Hunar Sikhna',    description: 'Learn practical Seva skills — langar service, practical trades',   minutes: 30  },
      { id: 'sanyam',         icon: '🌊', label: 'Sanyam',          description: 'Practice restraint in food, sleep, and speech',                    minutes: 0   },
      { id: 'gurdwara_seva',  icon: '☬',  label: 'Gurdwara Seva',   description: 'Help in langar, cleaning, or Sangat service',                      minutes: 30  },
    ],
    grihastha: [
      { id: 'kirat',          icon: '💼', label: 'Kirat Karni',     description: 'Earn honestly through honest labour — work is worship',            minutes: 480 },
      { id: 'family',         icon: '🏡', label: 'Parivar Prem',    description: 'Give real time to spouse, children, and aging parents',            minutes: 60  },
      { id: 'excellence',     icon: '⚡', label: 'Kartavya',        description: 'Professional excellence — do your work as Seva to Waheguru',       minutes: 0   },
      { id: 'dasvandh',       icon: '📊', label: 'Dasvandh',        description: 'Give a tenth of your earnings — financial discipline and charity',  minutes: 15  },
      { id: 'health',         icon: '🌿', label: 'Sehat',           description: 'Exercise and eat simply — health is needed for Seva',               minutes: 30  },
      { id: 'balance',        icon: '⚖️', label: 'Santulan',        description: 'Work hard but protect Sangat time and family evenings',            minutes: 0   },
      { id: 'vand_chhakna',   icon: '🤝', label: 'Vand Chhakna',    description: 'Share food and earnings with those in need — before yourself',     minutes: 30  },
      { id: 'sangat',         icon: '☬',  label: 'Sangat',          description: 'Attend Gurdwara regularly — connect with the spiritual community',  minutes: 60  },
    ],
    vanaprastha: [
      { id: 'handover',       icon: '🌿', label: 'Zimmedari Saunpna',description: 'Hand responsibilities to the next generation gradually',          minutes: 0   },
      { id: 'mentoring',      icon: '🌳', label: 'Sedhna',          description: 'Guide youth, community, and family with patience',                 minutes: 60  },
      { id: 'bani',           icon: '📜', label: 'Bani Vichaar',    description: 'Study Nitnem and Bani with greater depth and understanding',       minutes: 60  },
      { id: 'simplify',       icon: '🍂', label: 'Sadgi',           description: 'Reduce possessions, desires, and social complexity',              minutes: 0   },
      { id: 'deep_simran',    icon: '🧘', label: 'Gehri Bandagi',   description: 'Longer, deeper Naam Simran — make it the day\'s centre',          minutes: 60  },
      { id: 'pilgrimage',     icon: '☬',  label: 'Takhton Di Yatra',description: 'Visit Takhts and historic Gurdwaras — seek Sangat of the wise',   minutes: 0   },
      { id: 'nature',         icon: '🌄', label: 'Prakriti',        description: 'Long walks and quiet reflection — let the world slow around you',  minutes: 30  },
      { id: 'teach',          icon: '🪔', label: 'Vidya Vartaana',  description: 'Share Bani knowledge with those who are ready to receive',        minutes: 30  },
    ],
    sannyasa: [
      { id: 'withdrawal',     icon: '🕊️', label: 'Moh Mukti',      description: 'Release all worldly roles — let attachments dissolve in Waheguru', minutes: 0  },
      { id: 'intensive',      icon: '∞',   label: 'Simran',         description: 'Naam Simran 2 or more hours daily — the whole day is prayer',      minutes: 120 },
      { id: 'minimal',        icon: '🌾', label: 'Saada Jeevan',    description: 'Minimal needs — total trust in Waheguru\'s provision',             minutes: 0   },
      { id: 'bani',           icon: '📿', label: 'Gurbani Paath',   description: 'Recite and contemplate Bani continuously throughout the day',      minutes: 0   },
      { id: 'universal',      icon: '🌍', label: 'Nishkam Seva',    description: 'Serve all without distinction or expectation of return',           minutes: 0   },
      { id: 'teach',          icon: '🌞', label: 'Bani Dana',       description: 'Share Gurbani wisdom freely with any sincere seeker',              minutes: 0   },
      { id: 'chardi_kala',    icon: '🍃', label: 'Chardi Kala',     description: 'Maintain eternal optimism — detach from praise, blame, outcome',   minutes: 0   },
      { id: 'waheguru_prep',  icon: '🙏', label: 'Waheguru Simran', description: 'Prepare in Chardi Kala — spiritual readiness for the final union', minutes: 0  },
    ],
  },

  // ── Buddhist ───────────────────────────────────────────────────────────────
  buddhist: {
    brahmacharya: [
      { id: 'dharma_study',   icon: '📚', label: 'Dharma Study',    description: 'Learn the teachings — suttas, Buddha\'s life, and precepts',       minutes: 60  },
      { id: 'body',           icon: '🤸', label: 'Right Care',      description: 'Exercise, yoga, or walking — care for the body mindfully',          minutes: 30  },
      { id: 'teacher',        icon: '🙇', label: 'Kalyana Mitta',   description: 'Seek wise friends and teachers — listen with an open mind',         minutes: 20  },
      { id: 'meditation',     icon: '🧘', label: 'Samatha',         description: 'Sit for 5–10 minutes — develop calm and concentration',             minutes: 10  },
      { id: 'precepts',       icon: '🎯', label: 'Five Precepts',   description: 'Keep the five precepts — the foundation of lay practice',           minutes: 0   },
      { id: 'skill',          icon: '🛠️', label: 'Right Livelihood',description: 'Develop skills for a livelihood that causes no harm',               minutes: 30  },
      { id: 'generosity',     icon: '🌊', label: 'Dana',            description: 'Practice generosity — give time, resources, or service',            minutes: 15  },
      { id: 'sangha',         icon: '☸️', label: 'Sangha',          description: 'Join the Buddhist community — learn with and from others',          minutes: 30  },
    ],
    grihastha: [
      { id: 'right_action',   icon: '💼', label: 'Right Action',    description: 'Work ethically with full effort — livelihood as practice',          minutes: 480 },
      { id: 'family',         icon: '🏡', label: 'Compassion',      description: 'Give real time and compassion to family members',                  minutes: 60  },
      { id: 'excellence',     icon: '⚡', label: 'Diligence',       description: 'Do your work with mindful excellence — fully present',              minutes: 0   },
      { id: 'finance',        icon: '📊', label: 'Non-Greed',       description: 'Budget, share, avoid excess — contentment is wealth',              minutes: 15  },
      { id: 'health',         icon: '🌿', label: 'Mindful Health',  description: 'Exercise and eat with awareness — health supports practice',        minutes: 30  },
      { id: 'balance',        icon: '⚖️', label: 'Middle Way',      description: 'Balance work and practice — neither extreme serves',               minutes: 0   },
      { id: 'community',      icon: '🤝', label: 'Metta Seva',      description: 'Volunteer and offer loving-kindness to your community',            minutes: 30  },
      { id: 'preparation',    icon: '🌅', label: 'Impermanence',    description: 'Reflect on impermanence — prepare the mind for the next stage',    minutes: 15  },
    ],
    vanaprastha: [
      { id: 'handover',       icon: '🌿', label: 'Release',         description: 'Reduce worldly responsibilities — pass them to capable hands',     minutes: 0   },
      { id: 'mentoring',      icon: '🌳', label: 'Teaching',        description: 'Guide others on the path — share what you have learned',           minutes: 60  },
      { id: 'deep_study',     icon: '📜', label: 'Deep Dharma',     description: 'Study Abhidhamma and profound suttas — go deeper in understanding', minutes: 60 },
      { id: 'simplify',       icon: '🍂', label: 'Simplification',  description: 'Reduce possessions and social complexity — lighten the load',      minutes: 0   },
      { id: 'deep_practice',  icon: '🧘', label: 'Vipassana',       description: 'Longer meditation — develop insight and wisdom',                   minutes: 60  },
      { id: 'pilgrimage',     icon: '☸️', label: 'Sacred Journey',  description: 'Visit Bodh Gaya, Lumbini, Sarnath — deepen through pilgrimage',    minutes: 0   },
      { id: 'nature',         icon: '🌄', label: 'Forest Time',     description: 'Time in nature — walking meditation and quiet reflection',          minutes: 30  },
      { id: 'legacy',         icon: '🪔', label: 'Dharma Legacy',   description: 'Prepare worthy students to carry the teaching forward',            minutes: 30  },
    ],
    sannyasa: [
      { id: 'withdrawal',     icon: '🕊️', label: 'Full Release',   description: 'Let go of all worldly roles and possessions completely',           minutes: 0   },
      { id: 'intensive',      icon: '∞',   label: 'Deep Samadhi',   description: 'Meditate 2 or more hours daily — liberation is near',              minutes: 120 },
      { id: 'minimal',        icon: '🌾', label: 'Minimum Needs',   description: 'Bare minimum possessions, food, shelter — chosen poverty',         minutes: 0   },
      { id: 'contemplation',  icon: '📿', label: 'Sutta Chanting',  description: 'Recite and contemplate the suttas throughout the day',             minutes: 0   },
      { id: 'universal',      icon: '🌍', label: 'Universal Metta', description: 'Radiate loving-kindness without boundary or expectation',          minutes: 0   },
      { id: 'teach',          icon: '🌞', label: 'Dharma Gift',     description: 'Share the Dharma freely — the greatest generosity',                minutes: 0   },
      { id: 'detach',         icon: '🍃', label: 'Non-Attachment',  description: 'Complete non-attachment — no clinging to outcomes or identity',    minutes: 0   },
      { id: 'nibbana',        icon: '🙏', label: 'Nibbana Path',    description: 'Focused entirely on liberation — all action is practice',          minutes: 0   },
    ],
  },

  // ── Jain ───────────────────────────────────────────────────────────────────
  jain: {
    brahmacharya: [
      { id: 'agam_study',     icon: '📚', label: 'Agam Study',      description: 'Study the Agam texts and Jain philosophy with a mentor',           minutes: 60  },
      { id: 'body',           icon: '🤸', label: 'Tan Shuddhi',     description: 'Exercise mindfully — care for the body without violence',          minutes: 30  },
      { id: 'elder_respect',  icon: '🙇', label: 'Guru Vinay',      description: 'Honour elders and teachers — listen before forming opinions',      minutes: 20  },
      { id: 'meditation',     icon: '🧘', label: 'Samayika',        description: 'Sit in equanimity 5–10 minutes — calm the vibrations of the soul', minutes: 10  },
      { id: 'anuvrats',       icon: '🎯', label: 'Anuvrat',         description: 'Observe the five small vows — the basis of Jain lay practice',     minutes: 0   },
      { id: 'ahimsa_skill',   icon: '🛠️', label: 'Ahimsa Vyavsay', description: 'Develop a livelihood that causes minimum harm to living beings',   minutes: 30  },
      { id: 'tapas',          icon: '🌊', label: 'Tapas',           description: 'Practice restraint in food and pleasure — light austerity',        minutes: 0   },
      { id: 'sangha',         icon: '🌺', label: 'Sangha Seva',     description: 'Serve the Jain community — attend Paryushana, help the temple',   minutes: 30  },
    ],
    grihastha: [
      { id: 'artha_ahimsa',   icon: '💼', label: 'Satya Artha',     description: 'Earn through honest, ahimsa-aligned livelihood',                  minutes: 480 },
      { id: 'family',         icon: '🏡', label: 'Parivar Prem',    description: 'Give genuine time to spouse, children, and parents',              minutes: 60  },
      { id: 'excellence',     icon: '⚡', label: 'Nishtha',         description: 'Do your work with integrity and full effort',                     minutes: 0   },
      { id: 'finance',        icon: '📊', label: 'Parigraha Maryada',description: 'Set a limit on possessions — do not accumulate beyond need',     minutes: 15  },
      { id: 'health',         icon: '🌿', label: 'Shrir Raksha',    description: 'Exercise and eat with ahimsa — vegetarian, simple, nourishing',   minutes: 30  },
      { id: 'balance',        icon: '⚖️', label: 'Madhyastha',      description: 'Balance family duty and spiritual practice — neither neglected',  minutes: 0   },
      { id: 'dana',           icon: '🤝', label: 'Dana',            description: 'Give generously to the poor, the temple, and those in need',      minutes: 30  },
      { id: 'preparation',    icon: '🌅', label: 'Vivek',           description: 'Gradually increase spiritual focus — prepare for the next stage', minutes: 15  },
    ],
    vanaprastha: [
      { id: 'handover',       icon: '🌿', label: 'Vyapar Tyag',     description: 'Step back from business — hand it to the next generation',        minutes: 0   },
      { id: 'mentoring',      icon: '🌳', label: 'Siksha Dana',     description: 'Mentor family and community in Jain values and practice',         minutes: 60  },
      { id: 'agam_deep',      icon: '📜', label: 'Agam Vichaar',    description: 'Study the Agams deeply — understand the Tattvas fully',           minutes: 60  },
      { id: 'simplify',       icon: '🍂', label: 'Aparigraha',      description: 'Reduce possessions towards the Anuvrat limit',                   minutes: 0   },
      { id: 'samayika',       icon: '🧘', label: 'Deergha Samayika',description: 'Longer Samayika — extended equanimity practice daily',            minutes: 60  },
      { id: 'tirtha',         icon: '🛕', label: 'Tirtha Yatra',    description: 'Pilgrimage to Palitana, Shatrunjaya — seek the presence of the Tirthankaras', minutes: 0 },
      { id: 'nature',         icon: '🌄', label: 'Prakriti Sanga',  description: 'Time in quiet nature — walking reflection without harm',          minutes: 30  },
      { id: 'disciples',      icon: '🪔', label: 'Shishya Palan',   description: 'Prepare sincere seekers to receive deeper Agam wisdom',           minutes: 30  },
    ],
    sannyasa: [
      { id: 'diksha',         icon: '🕊️', label: 'Diksha Path',    description: 'Consider or take Diksha — complete renunciation of worldly life',  minutes: 0   },
      { id: 'intensive',      icon: '∞',   label: 'Pratikraman',    description: 'Intensive Pratikraman and Samayika — 2 or more hours daily',       minutes: 120 },
      { id: 'minimal',        icon: '🌾', label: 'Alpa Bhoga',      description: 'Minimum food, possessions, shelter — voluntary asceticism',       minutes: 0   },
      { id: 'agam_chanting',  icon: '📿', label: 'Sutra Paath',     description: 'Recite and contemplate Agam sutras throughout the day',           minutes: 0   },
      { id: 'universal',      icon: '🌍', label: 'Sarva Seva',      description: 'Serve all beings without distinction or expectation',             minutes: 0   },
      { id: 'teach',          icon: '🌞', label: 'Dharma Dana',     description: 'Share Jain wisdom freely — the Dharma gift is supreme',           minutes: 0   },
      { id: 'detach',         icon: '🍃', label: 'Vairagya',        description: 'Total non-attachment — beyond all worldly and bodily concerns',   minutes: 0   },
      { id: 'moksha',         icon: '🙏', label: 'Moksha Sadhana',  description: 'Focus entirely on liberation of the soul from karmic bondage',    minutes: 0   },
    ],
  },

  // ── Other / Universal ──────────────────────────────────────────────────────
  other: {
    brahmacharya: [
      { id: 'study',          icon: '📚', label: 'Study',           description: 'Dedicate 1–2 hours to focused learning daily',                     minutes: 90  },
      { id: 'body',           icon: '🤸', label: 'Physical Practice',description: 'Exercise, sports, or movement — build the body',                  minutes: 30  },
      { id: 'elder_respect',  icon: '🙇', label: 'Respect Elders',  description: 'Seek guidance — listen more than you speak',                       minutes: 20  },
      { id: 'meditation',     icon: '🧘', label: 'Mental Clarity',  description: 'Meditate 5–10 minutes — clear and settle the mind',                minutes: 10  },
      { id: 'discipline',     icon: '🎯', label: 'Avoid Distraction',description: 'Limit social media, idle time, vices',                           minutes: 0   },
      { id: 'skill',          icon: '🛠️', label: 'Develop Skills',  description: 'Learn practical abilities — cooking, finances, a craft',           minutes: 30  },
      { id: 'self_control',   icon: '🌊', label: 'Self-Control',    description: 'Practice discipline in food, sleep, speech, and energy',           minutes: 0   },
      { id: 'service',        icon: '🌺', label: 'Serve Teachers',  description: 'Help and support those who teach you',                             minutes: 15  },
    ],
    grihastha: [
      { id: 'provide',        icon: '💼', label: 'Provide',         description: 'Work with focus — earn honestly and fulfil family obligations',     minutes: 480 },
      { id: 'family',         icon: '🏡', label: 'Care for Family', description: 'Give real time to spouse, children, and aging parents',            minutes: 60  },
      { id: 'excellence',     icon: '⚡', label: 'Fulfil Duties',   description: 'Professional work done with genuine excellence',                   minutes: 0   },
      { id: 'finance',        icon: '📊', label: 'Financial Wisdom',description: 'Budget, save, invest — protect the family future',                 minutes: 15  },
      { id: 'health',         icon: '🌿', label: 'Maintain Health', description: 'Exercise, eat well — energy is the currency of duty',             minutes: 30  },
      { id: 'balance',        icon: '⚖️', label: 'Balance',         description: 'Work hard but protect family and personal time',                   minutes: 0   },
      { id: 'community',      icon: '🤝', label: 'Help Community',  description: 'Volunteer, mentor younger people, give back',                     minutes: 30  },
      { id: 'future',         icon: '🌅', label: 'Plan Ahead',      description: 'Prepare for the next stage — savings, wisdom, simplicity',        minutes: 15  },
    ],
    vanaprastha: [
      { id: 'step_back',      icon: '🌿', label: 'Step Back',       description: 'Gradually reduce career responsibilities — hand them over',        minutes: 0   },
      { id: 'mentoring',      icon: '🌳', label: 'Guide Others',    description: 'Mentor children, colleagues, community — pass what you know',      minutes: 60  },
      { id: 'spirituality',   icon: '📜', label: 'Study Wisdom',    description: 'Read sacred texts and philosophy — deepen understanding',          minutes: 45  },
      { id: 'simplify',       icon: '🍂', label: 'Simplify Life',   description: 'Reduce possessions, expenses, social obligations',                minutes: 0   },
      { id: 'deep_practice',  icon: '🧘', label: 'Deepen Practice', description: 'Meditate longer — deepen spiritual discipline without hurry',      minutes: 45  },
      { id: 'pilgrimage',     icon: '🛕', label: 'Pilgrimage',      description: 'Visit sacred places — seek wisdom in holy company',               minutes: 0   },
      { id: 'nature',         icon: '🌄', label: 'Spend in Nature', description: 'Long walks, quiet reflection in natural spaces',                   minutes: 30  },
      { id: 'disciples',      icon: '🪔', label: 'Prepare Disciples',description: 'Pass knowledge to those who are ready to learn',                 minutes: 30  },
    ],
    sannyasa: [
      { id: 'withdrawal',     icon: '🕊️', label: 'Full Withdrawal', description: 'Let go of career, property, and worldly roles completely',        minutes: 0   },
      { id: 'intensive',      icon: '∞',   label: 'Deep Practice',  description: 'Meditate 2 or more hours daily — liberation is the focus',        minutes: 120 },
      { id: 'minimal',        icon: '🌾', label: 'Simplest Living', description: 'Minimal possessions, food, shelter — voluntary simplicity',       minutes: 0   },
      { id: 'study',          icon: '📿', label: 'Study Continuously',description: 'Read and contemplate spiritual texts throughout the day',        minutes: 0   },
      { id: 'universal',      icon: '🌍', label: 'Universal Service',description: 'Help without expecting anything in return',                      minutes: 0   },
      { id: 'teach',          icon: '🌞', label: 'Teach Freely',    description: 'Share wisdom with any sincere seeker',                            minutes: 0   },
      { id: 'detach',         icon: '🍃', label: 'Release Attachment',description: 'Non-attachment to outcomes, people, results',                  minutes: 0   },
      { id: 'prepare',        icon: '🙏', label: 'Prepare for Death',description: 'Spiritual readiness — focus entirely on liberation',             minutes: 0   },
    ],
  },
};

export function getAshramaDuties(tradition: string, stage: LifeStage): AshramaDuty[] {
  const byTradition = DUTIES[tradition] ?? DUTIES.other;
  return byTradition[stage] ?? DUTIES.other[stage];
}

// ── Notification copy — tradition × life stage ────────────────────────────────
// Used by the nitya-reminder cron to personalise push notification body text

const STAGE_NUDGE_SUFFIX: Record<LifeStage, string> = {
  brahmacharya: 'This is your season of building — every day of discipline compounds.',
  grihastha:    'Your practice sustains your family. The world runs on householders who show up.',
  vanaprastha:  'Your sadhana deepens now — the world needs your wisdom more than your activity.',
  sannyasa:     'You are the practice. Each breath in stillness is a gift to all living beings.',
};

export function getAshramaNudgeSuffix(stage: LifeStage | null | undefined): string {
  if (!stage) return '';
  return ' ' + (STAGE_NUDGE_SUFFIX[stage] ?? '');
}
