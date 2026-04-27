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

export type LifeStage    = 'brahmacharya' | 'grihastha' | 'vanaprastha' | 'sannyasa';
export type GenderContext = 'female' | 'general';

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

export function getAshramaMeta(tradition: string, stage: LifeStage, genderContext?: GenderContext | null): AshramaMeta {
  const generalMeta = (STAGE_META_BY_TRADITION[tradition] ?? STAGE_META_BY_TRADITION.other)[stage];
  const femaleMeta  = genderContext === 'female'
    ? (STAGE_META_FEMALE[tradition] ?? STAGE_META_FEMALE.other)[stage]
    : null;
  return {
    key:    stage,
    icon:   STAGE_ICONS[stage],
    accent: STAGE_ACCENTS[stage],
    ...(femaleMeta ?? generalMeta),
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

// ── Female stage labels — tradition-aware ─────────────────────────────────────
// The four universal DB keys stay the same; only the display name + subtitle
// and age-range context differs when the Stridharma path is selected.
const STAGE_META_FEMALE: Record<string, Record<LifeStage, Omit<AshramaMeta, 'key' | 'icon' | 'accent'>>> = {
  hindu: {
    brahmacharya: { label: 'Brahmacharini', subtitle: 'Student — Vidya, Kala, inner preparation',       ageRange: '0–25'  },
    grihastha:    { label: 'Grihasthi',     subtitle: 'Householder — Shakti of the home & family',      ageRange: '25–50' },
    vanaprastha:  { label: 'Vanaprasthi',   subtitle: 'Elder — wisdom-keeper, Devi sadhana deepens',    ageRange: '50–75' },
    sannyasa:     { label: 'Sannyasini',    subtitle: 'Renunciate — Shakti at rest, liberation path',   ageRange: '75+'   },
  },
  sikh: {
    brahmacharya: { label: 'Vidhyarthin',   subtitle: 'Student — Gurbani, Seva, Kirtani skills',        ageRange: '0–25'  },
    grihastha:    { label: 'Grihasthin',    subtitle: 'Householder — Ghar di Jyot, Sangat, Kirat',      ageRange: '25–50' },
    vanaprastha:  { label: 'Bujurg Bibi',   subtitle: 'Elder woman — guide, deepen Bani, simplify',     ageRange: '50–75' },
    sannyasa:     { label: 'Seva-Mukti',    subtitle: 'Pure surrender — Waheguru simran, liberation',   ageRange: '75+'   },
  },
  buddhist: {
    brahmacharya: { label: 'Shravika',      subtitle: 'Listener — Dhamma, precepts, Bhikkhuni sangha',  ageRange: '0–25'  },
    grihastha:    { label: 'Upasika',       subtitle: 'Lay practitioner — mindful home, metta, dana',   ageRange: '25–50' },
    vanaprastha:  { label: 'Therī Path',    subtitle: 'Elder — deepen, teach, Anagārikā option',        ageRange: '50–75' },
    sannyasa:     { label: 'Bhikkhunī',     subtitle: 'Renunciate — Vinaya, Patimokkha, liberation',    ageRange: '75+'   },
  },
  jain: {
    brahmacharya: { label: 'Shravika Bal',  subtitle: 'Young Shravika — Navkar, Samayika, vrat learn',  ageRange: '0–25'  },
    grihastha:    { label: 'Shravika',      subtitle: 'Lay woman — home puja, Paryushana, ahimsa',      ageRange: '25–50' },
    vanaprastha:  { label: 'Shravika Jyeshtha', subtitle: 'Senior — greater vows, Sadhvi guidance',     ageRange: '50–75' },
    sannyasa:     { label: 'Sadhvi',        subtitle: 'Female ascetic — Mahavrat, full renunciation',   ageRange: '75+'   },
  },
  other: {
    brahmacharya: { label: 'Student',       subtitle: 'Learn, develop, build inner foundation',          ageRange: '0–25'  },
    grihastha:    { label: 'Householder',   subtitle: 'Care, nurture, work — family and community',      ageRange: '25–50' },
    vanaprastha:  { label: 'Elder',         subtitle: 'Wisdom-keeper — mentor, withdraw, deepen',        ageRange: '50–75' },
    sannyasa:     { label: 'Contemplative', subtitle: 'Liberation — detachment, stillness, service',     ageRange: '75+'   },
  },
};

// ── Female Duties — tradition × life stage (Stridharma path) ─────────────────
// Shown when gender_context === 'female'. Liturgically and culturally accurate
// for each tradition. The four universal stage keys are unchanged in the DB.
const DUTIES_FEMALE: Record<string, Record<LifeStage, AshramaDuty[]>> = {

  // ── Hindu Stridharma ───────────────────────────────────────────────────────
  hindu: {
    brahmacharya: [
      { id: 'vidya',          icon: '📚', label: 'Vidya Abhyas',      description: 'Study scripture, literature, and arts — Vedic tradition opens fully to sincere seekers', minutes: 90  },
      { id: 'kala',           icon: '🎶', label: 'Shodasha Kala',     description: 'Learn a traditional Kala — music, dance, culinary arts, textile, or fine craft',          minutes: 45  },
      { id: 'guru_seva',      icon: '🙇', label: 'Guru Seva',         description: 'Serve and honour those teaching you — receive their knowledge with humility',              minutes: 20  },
      { id: 'dhyana',         icon: '🧘', label: 'Dhyana',            description: 'Sit in stillness 5–10 minutes — anchor the mind before the day\'s demands begin',          minutes: 10  },
      { id: 'brahmacharya',   icon: '🌊', label: 'Brahmacharya',      description: 'Cultivate purity of body, speech, and vital energy — the foundation of Shakti',          minutes: 0   },
      { id: 'shringar_bodha', icon: '🌸', label: 'Shringaar Bodha',   description: 'Learn the sacred significance of Solah Shringaar — adornment as devotional offering',    minutes: 15  },
      { id: 'stridharma',     icon: '📜', label: 'Stridharma Bodha',  description: 'Study the philosophy of womanhood in dharma — Manusmriti, Maitreyi, Gargi, Lakshmibai', minutes: 20  },
      { id: 'pitru_bhakti',   icon: '🌺', label: 'Pitru Bhakti',      description: 'Honour and serve parents with genuine respect — they are the first teachers',             minutes: 15  },
    ],
    grihastha: [
      { id: 'gruha_lakshmi',  icon: '🪔', label: 'Gruha Lakshmi',     description: 'You are the Shakti of the home — maintain its sanctity, warmth, and sacred atmosphere',  minutes: 30  },
      { id: 'puja_ghar',      icon: '🌺', label: 'Puja Ghar Seva',    description: 'Tend the home shrine daily — you are the traditional keeper of the sacred space',         minutes: 20  },
      { id: 'sumangali',      icon: '💛', label: 'Sumangali Dharma',  description: 'Daily auspicious practices — kumkum, sindoor, mangalsutra; these are Shakti sadhana',     minutes: 15  },
      { id: 'vrat',           icon: '🌙', label: 'Vrat Palan',        description: 'Observe your vratas — Ekadashi, Solah Somvar, Mangalvaar; each fast is a tapas',          minutes: 0   },
      { id: 'santana',        icon: '👶', label: 'Santana Raksha',     description: 'Transmit values to children — garbha-sanskar, stories, daily puja together',             minutes: 60  },
      { id: 'stri_sangha',    icon: '🤝', label: 'Stri Sangha',       description: 'Community with other women — oral traditions, Gita milans, vrat celebrations',            minutes: 30  },
      { id: 'poshana',        icon: '🌿', label: 'Poshana',           description: 'Cook with sattvic intention — feeding the family is an act of yajna',                    minutes: 45  },
      { id: 'parivar_dharma', icon: '⚖️', label: 'Parivar Dharma',   description: 'Support family dharma while maintaining your own sadhana — both are non-negotiable',      minutes: 0   },
    ],
    vanaprastha: [
      { id: 'jyeshtha',       icon: '🌿', label: 'Jyeshtha Drishti',  description: 'Become the wisdom-keeper — the family turns to you; your stillness is the anchor',      minutes: 0   },
      { id: 'vrat_shithil',   icon: '🍂', label: 'Vrat Shithilam',    description: 'Ease the heavier vratas; shift energy from external ritual to internal tapas',            minutes: 0   },
      { id: 'shastra_stri',   icon: '📜', label: 'Devi Shastra',      description: 'Study Devi Mahatmyam, Devi Bhagavata, Ramayana — the feminine face of the divine',       minutes: 45  },
      { id: 'snusha_seva',    icon: '🌳', label: 'Vamsha Siksha',     description: 'Mentor daughters and daughters-in-law in tradition — pass the living practice forward', minutes: 60  },
      { id: 'tapas',          icon: '🧘', label: 'Tapas Vridhi',      description: 'Longer meditation — surrender domestic control gradually as sadhana deepens',             minutes: 45  },
      { id: 'tirtha',         icon: '🛕', label: 'Tirtha Yatra',      description: 'Pilgrimage — Vaishno Devi, Vrindavan, Kashi; seek Devi\'s darshan and satsang',           minutes: 0   },
      { id: 'devi_upasana',   icon: '🌸', label: 'Devi Upasana',      description: 'Deepen worship of the goddess in her many forms — Lalita, Durga, Lakshmi, Saraswati',   minutes: 30  },
      { id: 'prakriti',       icon: '🌄', label: 'Prakriti Sanga',    description: 'Walk in nature at dawn or dusk — Prakriti is Devi; let the world quiet around you',      minutes: 30  },
    ],
    sannyasa: [
      { id: 'sarva_tyaga',    icon: '🕊️', label: 'Sarva Tyaga',      description: 'Release all roles: mother, wife, daughter — let them dissolve in love, not bitterness', minutes: 0   },
      { id: 'antar_tapas',    icon: '∞',   label: 'Antar Tapas',      description: 'Meditate 2 or more hours daily — Shakti turned inward is the fiercest sadhana',          minutes: 120 },
      { id: 'alpa_bhoga',     icon: '🌾', label: 'Alpa Bhoga',        description: 'Minimal food, clothing, shelter — voluntary simplicity is itself a Shakti practice',      minutes: 0   },
      { id: 'devi_sadhana',   icon: '🌸', label: 'Devi Sadhana',      description: 'Contemplate Tripura Sundari, Kali, Lalita — the goddess in all forms is you',            minutes: 60  },
      { id: 'vishva_seva',    icon: '🌍', label: 'Vishva Seva',       description: 'Serve without distinction or expectation — the world as one family, one Shakti',         minutes: 0   },
      { id: 'jnana_dana',     icon: '🌞', label: 'Jnana Dana',        description: 'Share wisdom freely with sincere women seekers — the lineage continues through you',      minutes: 0   },
      { id: 'vairagya',       icon: '🍃', label: 'Vairagya',          description: 'Non-attachment — including release of all identity, including womanhood itself',          minutes: 0   },
      { id: 'moksha',         icon: '🙏', label: 'Moksha Sadhana',    description: 'Liberation through Shakti-Vedanta — you are the witness behind every role and every form', minutes: 0 },
    ],
  },

  // ── Sikh Stridharma ───────────────────────────────────────────────────────
  // Guru Nanak said: "So kyon manda aakhiye jit jamme rajaan" —
  // why call her inferior who gives birth to kings? Duties reflect equality
  // in dharma but honour cultural practice differences.
  sikh: {
    brahmacharya: [
      { id: 'gurbani_vidya',  icon: '📚', label: 'Gurbani Vidya',     description: 'Learn from the Guru Granth Sahib — study Nitnem with a female Granthi or teacher',       minutes: 60  },
      { id: 'ishnan',         icon: '🌊', label: 'Ishnan',            description: 'Morning bath before beginning Nitnem — body and spirit prepared for Waheguru',            minutes: 15  },
      { id: 'naam_simran',    icon: '🧘', label: 'Naam Simran',       description: 'Sit in stillness with Waheguru — the Gurmantar as breath beneath all activity',           minutes: 15  },
      { id: 'kirtani',        icon: '🎶', label: 'Kirtani Seva',      description: 'Learn kirtan — harmonium, sarangi, or voice; the Gurdwara sangat opens equally to women',  minutes: 45  },
      { id: 'sanyam',         icon: '🎯', label: 'Sanyam',            description: 'Restraint in food, sleep, social media, and idle company — keep Sadh Sangat',             minutes: 0   },
      { id: 'langar_seva',    icon: '🛠️', label: 'Langar Seva',       description: 'Service in the langar — cooking as seva is among the highest acts of worship',           minutes: 30  },
      { id: 'gurdwara_seva',  icon: '☬',  label: 'Gurdwara Seva',     description: 'Cleaning, decorating, and serving in the Gurdwara — no task is beneath dignity',         minutes: 30  },
      { id: 'vadyan_seva',    icon: '🌺', label: 'Vadyan Di Seva',    description: 'Honour elders, especially the women elders (Bibian) — they carry the living tradition',   minutes: 15  },
    ],
    grihastha: [
      { id: 'ghar_jyot',      icon: '🪔', label: 'Ghar Di Jyot',      description: 'Be the light of the home — read Nitnem aloud for the household each morning',            minutes: 30  },
      { id: 'parivar_prem',   icon: '🏡', label: 'Parivar Prem',      description: 'Give real time to spouse, children, and aging parents — love is the highest seva',       minutes: 60  },
      { id: 'kirat',          icon: '💼', label: 'Kirat Karni',       description: 'Earn honestly — work is worship for Sikh women equally',                                  minutes: 480 },
      { id: 'dasvandh',       icon: '📊', label: 'Dasvandh',          description: 'Tithe — give a tenth in time, money, or service; financial discipline and generosity',    minutes: 15  },
      { id: 'santana_bani',   icon: '👶', label: 'Santana Siksha',    description: 'Raise children in Gurbani — morning Nitnem together plants the seed of faith',           minutes: 30  },
      { id: 'langar_griha',   icon: '🤝', label: 'Langar Griha',      description: 'Prepare and share food generously — the home as an extension of the Gurdwara',           minutes: 45  },
      { id: 'sangat',         icon: '☬',  label: 'Sangat',            description: 'Attend Gurdwara regularly — the spiritual community sustains the sadhana',                minutes: 60  },
      { id: 'vand_chhakna',   icon: '🌿', label: 'Vand Chhakna',      description: 'Share before yourself — food, time, earnings; Waheguru\'s grace multiplies what is given', minutes: 0  },
    ],
    vanaprastha: [
      { id: 'bibi_guidance',  icon: '🌿', label: 'Bibi Wisdom',       description: 'Become the family\'s elder Bibi — guide daughters and daughters-in-law in Gurbani',       minutes: 60  },
      { id: 'gehri_bandagi',  icon: '🧘', label: 'Gehri Bandagi',     description: 'Longer, deeper Naam Simran — make it the centre of the day, not its edges',             minutes: 60  },
      { id: 'bani_vichaar',   icon: '📜', label: 'Bani Vichaar',      description: 'Study the Bani with greater depth — sit with Shabad and let it open slowly',            minutes: 60  },
      { id: 'sadgi',          icon: '🍂', label: 'Sadgi',             description: 'Reduce possessions, desires, social complexity — let the home lighten',                  minutes: 0   },
      { id: 'takht_yatra',    icon: '☬',  label: 'Takhton Di Yatra',  description: 'Visit the five Takhts and historic Gurdwaras — receive Sangat of the wise',             minutes: 0   },
      { id: 'prakriti',       icon: '🌄', label: 'Prakriti',          description: 'Long walks in quiet nature — the world slows, Waheguru speaks in the silence',           minutes: 30  },
      { id: 'zimmedari',      icon: '🌳', label: 'Zimmedari Saunpna', description: 'Gradually hand domestic and community responsibilities to the next generation',           minutes: 0   },
      { id: 'kirtan_elder',   icon: '🪔', label: 'Kirtan Seva',       description: 'Continue singing Kirtan in the Sangat — the voice of an elder carries extra grace',      minutes: 30  },
    ],
    sannyasa: [
      { id: 'moh_mukti',      icon: '🕊️', label: 'Moh Mukti',        description: 'Release all worldly roles — let all attachments dissolve in Waheguru\'s light',           minutes: 0   },
      { id: 'simran',         icon: '∞',   label: 'Naam Simran',       description: 'Naam Simran 2 or more hours — the whole day becomes one continuous prayer',             minutes: 120 },
      { id: 'saada_jeevan',   icon: '🌾', label: 'Saada Jeevan',      description: 'Simplest needs — total surrender and trust in Waheguru\'s provision',                    minutes: 0   },
      { id: 'gurbani_paath',  icon: '📿', label: 'Gurbani Paath',     description: 'Recite and contemplate Bani throughout the day — every breath a Shabad',                minutes: 0   },
      { id: 'nishkam_seva',   icon: '🌍', label: 'Nishkam Seva',      description: 'Serve all without distinction or expectation of return',                                 minutes: 0   },
      { id: 'bani_dana',      icon: '🌞', label: 'Bani Dana',         description: 'Share Gurbani wisdom freely with any sincere seeker',                                    minutes: 0   },
      { id: 'chardi_kala',    icon: '🍃', label: 'Chardi Kala',       description: 'Eternal optimism — detach from praise, blame, and outcome; always in rising spirit',    minutes: 0   },
      { id: 'waheguru_simran',icon: '🙏', label: 'Akaal Ustat',       description: 'Prepare in Chardi Kala — spiritual readiness for the final union with Waheguru',        minutes: 0   },
    ],
  },

  // ── Buddhist Stridharma ───────────────────────────────────────────────────
  // The Therī Gāthā (Verses of the Elder Nuns) is one of the oldest women's
  // spiritual poetry collections in the world. The Bhikkhunī sangha path
  // is acknowledged but these duties apply to lay practitioners primarily.
  buddhist: {
    brahmacharya: [
      { id: 'dharma_study',   icon: '📚', label: 'Dharma Study',      description: 'Learn the Dhamma — suttas, Therī Gāthā, and the Buddha\'s teachings on women\'s liberation', minutes: 60 },
      { id: 'sila_care',      icon: '🌊', label: 'Sīla & Care',       description: 'Wash mindfully — outer cleanliness reflects sīla; begin the day in purity',              minutes: 15  },
      { id: 'kalyana_mitta',  icon: '🙇', label: 'Kalyāṇa Mittā',    description: 'Seek wise female teachers and the Bhikkhunī sangha — lineage carries the teaching',       minutes: 20  },
      { id: 'samatha',        icon: '🧘', label: 'Samatha',           description: 'Sit for 10–20 minutes — develop calm concentration before the day begins',                minutes: 15  },
      { id: 'five_precepts',  icon: '🎯', label: 'Five Precepts',     description: 'Renew the Five Precepts — especially the third; this is the core of lay sīla',           minutes: 0   },
      { id: 'right_livelihood',icon:'🛠️', label: 'Right Livelihood', description: 'Develop skills for work that causes no harm to living beings',                            minutes: 30  },
      { id: 'dana',           icon: '🤲', label: 'Dāna',             description: 'Practice generosity — offer food, service, or presence; open the hand and the heart',     minutes: 15  },
      { id: 'bhikkhuni_sangha',icon:'☸️', label: 'Bhikkhunī Sangha', description: 'Connect with the Bhikkhunī community — learn from the living female monastic tradition',  minutes: 30  },
    ],
    grihastha: [
      { id: 'right_action',   icon: '💼', label: 'Right Action',      description: 'Work ethically and with full effort — livelihood as mindful practice',                   minutes: 480 },
      { id: 'metta_family',   icon: '🏡', label: 'Metta in Family',   description: 'Give real, compassionate time to each family member — metta begins at home',            minutes: 60  },
      { id: 'uposatha',       icon: '🌙', label: 'Uposatha Days',     description: 'On new and full moon days take the Eight Precepts — a monthly deepening of practice',    minutes: 0   },
      { id: 'non_greed',      icon: '📊', label: 'Non-Greed',         description: 'Budget, share, avoid excess — contentment and generosity are inseparable in the Dhamma', minutes: 15  },
      { id: 'mindful_health', icon: '🌿', label: 'Mindful Health',    description: 'Exercise and eat with awareness — the body is the vehicle; care for it without clinging', minutes: 30 },
      { id: 'maternal_metta', icon: '💛', label: 'Maternal Metta',    description: 'Extend loving-kindness especially toward children and those in your care',               minutes: 15  },
      { id: 'metta_seva',     icon: '🤝', label: 'Mettā Seva',       description: 'Volunteer and offer loving-kindness to the community — the bodhisattva vow lives in action', minutes: 30 },
      { id: 'impermanence',   icon: '🌅', label: 'Anicca Reflection', description: 'Reflect on impermanence — prepare the mind for the next stage of life',                  minutes: 15  },
    ],
    vanaprastha: [
      { id: 'release',        icon: '🌿', label: 'Gradual Release',   description: 'Reduce worldly responsibilities — hand them to capable hands; trust the next generation', minutes: 0  },
      { id: 'theri_wisdom',   icon: '🌳', label: 'Therī Wisdom',      description: 'Share the path with younger women — the Therī tradition is carried this way',           minutes: 60  },
      { id: 'deep_dhamma',    icon: '📜', label: 'Deep Dhamma',       description: 'Study Abhidhamma and the profound suttas; read the Therī Gāthā with a teacher',          minutes: 60  },
      { id: 'simplify',       icon: '🍂', label: 'Simplification',    description: 'Reduce possessions and social complexity — lighten the load for the interior journey',   minutes: 0   },
      { id: 'vipassana',      icon: '🧘', label: 'Vipassana',         description: 'Longer sitting practice — develop insight into impermanence, no-self, and suffering',     minutes: 60  },
      { id: 'pilgrimage',     icon: '☸️', label: 'Sacred Journey',    description: 'Visit Lumbini, Bodh Gaya, Sarnath — the sacred sites deepen understanding',             minutes: 0   },
      { id: 'anagárika',      icon: '🌄', label: 'Anagārikā Option',  description: 'Consider the Anagārikā path — eight precepts, renunciant dress, deeper practice',        minutes: 0   },
      { id: 'legacy',         icon: '🪔', label: 'Dhamma Legacy',     description: 'Prepare sincere female students to carry the teaching forward',                          minutes: 30  },
    ],
    sannyasa: [
      { id: 'full_release',   icon: '🕊️', label: 'Full Release',     description: 'Release all worldly roles and possessions completely — let go with equanimity',          minutes: 0   },
      { id: 'deep_samadhi',   icon: '∞',   label: 'Deep Samādhi',     description: 'Meditate 2 or more hours daily — liberation is the focus now',                          minutes: 120 },
      { id: 'minimum_needs',  icon: '🌾', label: 'Minimum Needs',     description: 'Bare minimum possessions, food, and shelter — voluntary poverty as practice',           minutes: 0   },
      { id: 'sutta_chanting', icon: '📿', label: 'Sutta Chanting',    description: 'Recite and contemplate the suttas and Therī Gāthā throughout the day',                  minutes: 0   },
      { id: 'universal_metta',icon: '🌍', label: 'Universal Mettā',  description: 'Radiate loving-kindness to all beings without boundary or condition',                    minutes: 0   },
      { id: 'dharma_gift',    icon: '🌞', label: 'Dhamma Gift',       description: 'Share the Dhamma freely with sincere seekers — this is the highest generosity',         minutes: 0   },
      { id: 'non_attachment', icon: '🍃', label: 'Non-Attachment',    description: 'Complete non-attachment — no clinging to outcomes, identity, or even to womanhood',     minutes: 0   },
      { id: 'nibbana',        icon: '🙏', label: 'Nibbāna Path',      description: 'Focused entirely on liberation — as the Therīs showed, the path is open to all',        minutes: 0   },
    ],
  },

  // ── Jain Stridharma ───────────────────────────────────────────────────────
  // The Jain tradition recognises the Sadhvi (female ascetic) as fully equal
  // on the liberation path. Lay women (Shravikas) have specific observances
  // in the householder stage and a clear path toward Sadhvi Diksha if called.
  jain: {
    brahmacharya: [
      { id: 'agam_study',     icon: '📚', label: 'Agam Study',        description: 'Study the Agam texts and Jain philosophy — learn from a Sadhvi teacher if possible',     minutes: 60  },
      { id: 'tan_shuddhi',    icon: '🌊', label: 'Tan Shuddhi',       description: 'Physical purification before puja — no harm to living beings in bathing practice',        minutes: 15  },
      { id: 'guru_vinay',     icon: '🙇', label: 'Guru Vinay',        description: 'Honour elders and Sadhvis — receive wisdom from female ascetics who have gone further',    minutes: 20  },
      { id: 'samayika',       icon: '🧘', label: 'Samayika',          description: 'Sit in equanimity for 10–20 minutes — the supreme Jain practice opens to all from youth',  minutes: 15  },
      { id: 'anuvrat',        icon: '🎯', label: 'Anuvrat',           description: 'Observe the five small vows — the foundation of Shravika lay practice',                    minutes: 0   },
      { id: 'jina_puja',      icon: '🛠️', label: 'Jina Puja',         description: 'Learn the Ashtaprakari Puja — the eight-fold offering to the Tirthankar images',          minutes: 30  },
      { id: 'tapas',          icon: '🌊', label: 'Tapas',             description: 'Practice dietary restraint — no root vegetables, simple ahimsa meals',                    minutes: 0   },
      { id: 'sangha_seva',    icon: '🌺', label: 'Sangha Seva',       description: 'Serve the Jain community — Paryushana preparations, temple decoration, helping Sadhvis',   minutes: 30  },
    ],
    grihastha: [
      { id: 'gruha_puja',     icon: '🪔', label: 'Gruha Puja',        description: 'Daily puja of the Jina at the home shrine — the Shravika is the keeper of home worship',  minutes: 30  },
      { id: 'paryushana',     icon: '🌙', label: 'Paryushana Palan',  description: 'Observe all eight days of Paryushana — traditionally women fast more strictly',           minutes: 0   },
      { id: 'samayika_graha', icon: '🧘', label: 'Samayika',          description: 'Daily 48-minute vow of equanimity — the supreme practice, maintained in grihastha life',  minutes: 48  },
      { id: 'parigraha',      icon: '📊', label: 'Parigraha Maryada', description: 'Set a firm limit on possessions — do not accumulate beyond what the family truly needs',  minutes: 15  },
      { id: 'ahimsa_rsoui',   icon: '🌿', label: 'Ahimsa Rasoi',      description: 'Cook with ahimsa — no root vegetables, no late cooking, no harm to micro-organisms',       minutes: 45  },
      { id: 'santana_jain',   icon: '👶', label: 'Santana Siksha',    description: 'Transmit Jain values to children — Navkar Mantra, Samayika, ahimsa in daily choices',     minutes: 30  },
      { id: 'dana',           icon: '🤝', label: 'Dāna',             description: 'Give generously to the Sadhvi sangha, the temple, and those in need',                      minutes: 30  },
      { id: 'vivek',          icon: '🌅', label: 'Vivek',             description: 'Gradually increase spiritual practice — prepare the heart for the next stage',             minutes: 15  },
    ],
    vanaprastha: [
      { id: 'jain_elder',     icon: '🌿', label: 'Shravika Jyeshtha', description: 'Become the elder Shravika — guide younger women in Samayika, vrat, and puja practice',    minutes: 60  },
      { id: 'deergha_samayika',icon:'🧘', label: 'Deergha Samayika', description: 'Longer Samayika — extended equanimity practice; approach the Pratimā vow sequence',         minutes: 60  },
      { id: 'agam_vichaar',   icon: '📜', label: 'Agam Vichaar',      description: 'Study the Agams deeply with a teacher — understand the Tattvas and the path to moksha',   minutes: 60  },
      { id: 'aparigraha',     icon: '🍂', label: 'Aparigraha',        description: 'Reduce possessions towards the absolute minimum — each item released is a liberation',    minutes: 0   },
      { id: 'sadhvi_sanga',   icon: '🌳', label: 'Sadhvi Satsang',    description: 'Spend time with Sadhvis — their company accelerates the journey toward renunciation',     minutes: 60  },
      { id: 'tirtha',         icon: '🛕', label: 'Tirtha Yatra',      description: 'Pilgrimage to Palitana, Shatrunjaya — seek the presence of the Tirthankaras directly',   minutes: 0   },
      { id: 'pratima_vow',    icon: '🌄', label: 'Pratimā Vow',      description: 'Consider progressing through the 11 Pratimā stages — the lay path toward full renunciation', minutes: 0 },
      { id: 'shishya_palan',  icon: '🪔', label: 'Shishya Palan',    description: 'Prepare sincere Shravikas to carry the Agam tradition forward in the community',          minutes: 30  },
    ],
    sannyasa: [
      { id: 'sadhvi_diksha',  icon: '🕊️', label: 'Sadhvi Diksha',   description: 'Consider or take Sadhvi Diksha — complete renunciation of all worldly life',             minutes: 0   },
      { id: 'mahavrat',       icon: '∞',   label: 'Mahavrat',         description: 'Observe the five great vows fully — ahimsa, satya, asteya, brahmacharya, aparigraha',      minutes: 0   },
      { id: 'alpa_bhoga',     icon: '🌾', label: 'Alpa Bhoga',        description: 'Minimum food, possessions, shelter — accept only what is offered; desire nothing',        minutes: 0   },
      { id: 'sutra_paath',    icon: '📿', label: 'Sutra Paath',       description: 'Recite and contemplate Agam sutras throughout the day — the scripture is the practice',   minutes: 0   },
      { id: 'sarva_seva',     icon: '🌍', label: 'Sarva Seva',        description: 'Serve all living beings without distinction — ahimsa embodied in every interaction',       minutes: 0   },
      { id: 'dharma_dana',    icon: '🌞', label: 'Dharma Dana',       description: 'Share Jain wisdom freely — the Sadhvi\'s greatest offering is the living example',         minutes: 0   },
      { id: 'vairagya',       icon: '🍃', label: 'Vairagya',          description: 'Total non-attachment — no clinging to body, name, gender, or outcome',                    minutes: 0   },
      { id: 'moksha',         icon: '🙏', label: 'Moksha Sadhana',    description: 'Every breath is moksha-sadhana — liberation of the soul from all karmic bondage',         minutes: 0   },
    ],
  },

  // ── Other / Universal female path ─────────────────────────────────────────
  other: {
    brahmacharya: [
      { id: 'study',          icon: '📚', label: 'Study & Learn',     description: 'Dedicate 1–2 hours to focused learning — intellectual and spiritual cultivation',         minutes: 90  },
      { id: 'creative_arts',  icon: '🎶', label: 'Creative Arts',     description: 'Develop a creative practice — music, writing, craft, or visual art',                     minutes: 45  },
      { id: 'elder_respect',  icon: '🙇', label: 'Seek Guidance',     description: 'Learn from wise women elders — listen more than you speak',                              minutes: 20  },
      { id: 'meditation',     icon: '🧘', label: 'Mental Clarity',    description: 'Meditate 5–10 minutes — settle the mind before the day begins',                          minutes: 10  },
      { id: 'self_care',      icon: '🌸', label: 'Intentional Care',  description: 'Morning personal care as sacred ritual — not vanity but self-honouring',                 minutes: 15  },
      { id: 'skill',          icon: '🛠️', label: 'Practical Skills',  description: 'Learn practical abilities — cooking, finances, a craft, a trade',                        minutes: 30  },
      { id: 'self_control',   icon: '🌊', label: 'Self-Discipline',   description: 'Practice discipline in food, sleep, speech, and energy',                                  minutes: 0   },
      { id: 'community',      icon: '🌺', label: 'Women\'s Circle',    description: 'Connect with community of women — learn from and support each other',                    minutes: 30  },
    ],
    grihastha: [
      { id: 'home_sacred',    icon: '🪔', label: 'Sacred Home',       description: 'Tend the home with intention — it is a reflection of your inner life',                   minutes: 30  },
      { id: 'family',         icon: '🏡', label: 'Care for Family',   description: 'Give real, present time to spouse, children, and aging parents',                         minutes: 60  },
      { id: 'excellence',     icon: '⚡', label: 'Fulfil Duties',     description: 'Professional work with genuine excellence — your contribution matters',                  minutes: 0   },
      { id: 'finance',        icon: '📊', label: 'Financial Wisdom',  description: 'Budget, save, invest — protect the family future',                                        minutes: 15  },
      { id: 'health',         icon: '🌿', label: 'Nourish Health',    description: 'Exercise, eat well, rest — energy is the currency of care',                              minutes: 30  },
      { id: 'nurture',        icon: '👶', label: 'Transmit Values',   description: 'Pass wisdom and values to children through story, example, and daily practice',          minutes: 30  },
      { id: 'women_circle',   icon: '🤝', label: 'Women\'s Sangha',   description: 'Maintain community with other women — mutual support, wisdom sharing',                   minutes: 30  },
      { id: 'future',         icon: '🌅', label: 'Plan Ahead',        description: 'Prepare for the next stage — simplify, save, deepen your practice',                     minutes: 15  },
    ],
    vanaprastha: [
      { id: 'elder_wisdom',   icon: '🌿', label: 'Elder Wisdom',      description: 'Become the wisdom-keeper — the family and community turn to you',                        minutes: 0   },
      { id: 'mentoring',      icon: '🌳', label: 'Mentor Women',      description: 'Guide younger women with patience and genuine care — this is the lineage',               minutes: 60  },
      { id: 'spirituality',   icon: '📜', label: 'Deep Study',        description: 'Read sacred and philosophical texts — go deeper than you could before',                  minutes: 45  },
      { id: 'simplify',       icon: '🍂', label: 'Simplify Life',     description: 'Reduce possessions, desires, social obligations — lighten everything',                   minutes: 0   },
      { id: 'deep_practice',  icon: '🧘', label: 'Deepen Practice',   description: 'Meditate longer — the inner life takes centre stage now',                                minutes: 45  },
      { id: 'pilgrimage',     icon: '🛕', label: 'Sacred Journey',    description: 'Visit places of depth and beauty — pilgrimage in any tradition',                        minutes: 0   },
      { id: 'nature',         icon: '🌄', label: 'Time in Nature',    description: 'Long walks, quiet reflection — let the natural world teach',                             minutes: 30  },
      { id: 'legacy',         icon: '🪔', label: 'Living Legacy',     description: 'Prepare those ready to receive deeper wisdom — be the teacher you wished you had',       minutes: 30  },
    ],
    sannyasa: [
      { id: 'withdrawal',     icon: '🕊️', label: 'Full Withdrawal',  description: 'Release all roles completely — let them dissolve with gratitude',                        minutes: 0   },
      { id: 'intensive',      icon: '∞',   label: 'Deep Practice',    description: 'Meditate 2 or more hours daily — liberation is the singular focus',                      minutes: 120 },
      { id: 'minimal',        icon: '🌾', label: 'Simplest Living',   description: 'Minimum possessions, food, shelter — voluntary simplicity',                              minutes: 0   },
      { id: 'study',          icon: '📿', label: 'Continuous Study',  description: 'Read and contemplate wisdom texts throughout the day',                                   minutes: 0   },
      { id: 'universal',      icon: '🌍', label: 'Universal Service', description: 'Help without expecting anything in return',                                               minutes: 0   },
      { id: 'teach',          icon: '🌞', label: 'Teach Freely',      description: 'Share wisdom with any sincere woman — or anyone — who seeks',                            minutes: 0   },
      { id: 'detach',         icon: '🍃', label: 'Release Attachment',description: 'Non-attachment to outcomes, identity, roles — including gender itself',                  minutes: 0   },
      { id: 'prepare',        icon: '🙏', label: 'Liberation',        description: 'Spiritual readiness — every moment of stillness is preparation',                        minutes: 0   },
    ],
  },
};

// ── Modern female duties — contemporary, gender-equal framing ─────────────────
// These parallel DUTIES_FEMALE but replace classical stridharma framing with
// modern dharmic practice: career, wellness, equal partnership, community leadership.
// Traditions share the same "modern" set as the ethos transcends tradition.
const DUTIES_FEMALE_MODERN: Record<LifeStage, AshramaDuty[]> = {
  brahmacharya: [
    { id: 'm_study',    icon: '📚', label: 'Deep Study',          description: 'Pursue knowledge in any field — academic, spiritual, or creative. Learning is your birthright.', minutes: 60 },
    { id: 'm_body',     icon: '🧘', label: 'Body Practice',       description: 'Yoga, breathwork, or exercise — a healthy body is the first temple. Non-negotiable self-care.', minutes: 30 },
    { id: 'm_skills',   icon: '✨', label: 'Build a Skill',       description: 'Develop a skill that will serve you and the world — coding, writing, music, design, craft.', minutes: 45 },
    { id: 'm_journal',  icon: '📝', label: 'Reflective Journaling',description: 'Write thoughts, dreams, and intentions — clarity of mind is the foundation of dharmic action.', minutes: 15 },
    { id: 'm_mentor',   icon: '🌱', label: 'Seek Mentorship',     description: 'Find women (and men) who have walked the path you aspire to — learn from lived wisdom.', minutes: 0 },
    { id: 'm_service',  icon: '🤝', label: 'Community Service',   description: 'Give back — volunteer, teach, support — service multiplies purpose.', minutes: 30 },
  ],
  grihastha: [
    { id: 'm_career',   icon: '💼', label: 'Purposeful Work',     description: 'Your career is dharma — bring full presence to your vocation, whether professional or creative.', minutes: 0 },
    { id: 'm_partner',  icon: '🤝', label: 'Equal Partnership',   description: 'Shared responsibility — household duties, parenting, financial decisions — together, not assigned.', minutes: 0 },
    { id: 'm_practice', icon: '🧘', label: 'Personal Sadhana',    description: 'Meditation, breathwork, or puja — your spiritual life belongs to you, separate from family duty.', minutes: 20 },
    { id: 'm_finance',  icon: '💡', label: 'Financial Wisdom',    description: 'Understand and participate in household finances — financial literacy is modern dharma.', minutes: 15 },
    { id: 'm_wellness', icon: '🌿', label: 'Preventive Wellness', description: 'Nourishing food, adequate sleep, annual health checks — self-care is not selfish, it is essential.', minutes: 0 },
    { id: 'm_lead',     icon: '🌟', label: 'Community Leadership',description: 'Lead in your community — workplace, school, neighbourhood, or online. Your voice matters.', minutes: 0 },
  ],
  vanaprastha: [
    { id: 'm_mentor2',  icon: '🌿', label: 'Mentor Younger Women',description: 'Share hard-won wisdom with women starting out — mentorship is the highest gift at this stage.', minutes: 30 },
    { id: 'm_simplify', icon: '🍃', label: 'Intentional Simplicity',description: 'Declutter — possessions, commitments, roles. Create space for what truly matters now.', minutes: 0 },
    { id: 'm_deepen',   icon: '🧘', label: 'Deepen Practice',     description: 'Meditation, retreat, contemplation — this is the season to go deeper than ever before.', minutes: 30 },
    { id: 'm_create',   icon: '🎨', label: 'Creative Expression', description: 'Write, paint, teach, build — express the wisdom accumulated over a lifetime.', minutes: 45 },
    { id: 'm_health2',  icon: '💪', label: 'Active Ageing',       description: 'Strength, flexibility, and mindful movement — longevity is a spiritual act.', minutes: 30 },
  ],
  sannyasa: [
    { id: 'm_presence', icon: '🕊️', label: 'Presence as Teaching',description: 'Your stillness and equanimity are the teaching — simply being is the deepest service.', minutes: 0 },
    { id: 'm_release',  icon: '🌊', label: 'Graceful Release',    description: 'Release identification with roles, outcomes, and identity — what remains is the essential self.', minutes: 0 },
    { id: 'm_wisdom',   icon: '📖', label: 'Transmit Wisdom',     description: 'Share stories, write, or speak — the accumulated wisdom of a full life deserves to be recorded.', minutes: 30 },
    { id: 'm_peace',    icon: '☮️', label: 'Inner Peace Practice', description: 'Daily silence and stillness — the final frontier of practice is unconditional equanimity.', minutes: 20 },
  ],
};

export function getAshramaDuties(
  tradition: string,
  stage: LifeStage,
  genderContext?: GenderContext | null,
  practiceMode?: 'traditional' | 'modern',
): AshramaDuty[] {
  if (genderContext === 'female') {
    if (practiceMode === 'modern') {
      return DUTIES_FEMALE_MODERN[stage] ?? DUTIES_FEMALE_MODERN.grihastha;
    }
    const byTradition = DUTIES_FEMALE[tradition] ?? DUTIES_FEMALE.other;
    return byTradition[stage] ?? DUTIES_FEMALE.other[stage];
  }
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

// Stridharma-aware nudges — distinct voice, same stage keys
const STAGE_NUDGE_SUFFIX_FEMALE: Record<LifeStage, string> = {
  brahmacharya: 'This is your season of learning and preparation. Every Kala mastered is a flower on the path.',
  grihastha:    'Gruha Lakshmi — the home you tend is a temple. Your vratas and puja keep the dharma alive.',
  vanaprastha:  'The family grows around your stillness now. Your wisdom is the anchor they will not forget.',
  sannyasa:     'Shakti at rest. Your very presence teaches. Each breath is the goddess breathing.',
};

export function getAshramaNudgeSuffix(stage: LifeStage | null | undefined, genderContext?: GenderContext | null): string {
  if (!stage) return '';
  const map = genderContext === 'female' ? STAGE_NUDGE_SUFFIX_FEMALE : STAGE_NUDGE_SUFFIX;
  return ' ' + (map[stage] ?? '');
}
