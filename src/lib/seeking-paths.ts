export type SeekingKey = 'community' | 'knowledge' | 'events' | 'mentorship' | 'youth';
export type PersonalizedPathId = 'new-to-dharma' | 'city-anchor' | `seeking-${SeekingKey}`;

export interface PersonalizedPathAction {
  label: string;
  href: string;
  icon: string;
}

export interface PersonalizedPath {
  id: PersonalizedPathId;
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
  accentClass: string;
  actions: PersonalizedPathAction[];
}

type BuildPersonalizedPathsOptions = {
  seeking: string[];
  spiritualLevel?: string | null;
  city?: string | null;
  ashrama?: string | null;
  tradition?: string | null;
};

const PATH_DEFINITIONS: Record<SeekingKey, Omit<PersonalizedPath, 'id' | 'badges'>> = {
  community: {
    eyebrow: 'Find Your People',
    title: 'Build your local Sangam',
    description: 'Start nearby: see your Mandali, explore sacred places, and move toward your first real-world connection.',
    accentClass: 'clay-card-community',
    actions: [
      { label: 'Open My Mandali', href: '/mandali', icon: '🏡' },
      { label: 'Explore Tirtha Map', href: '/tirtha-map', icon: '🛕' },
    ],
  },
  knowledge: {
    eyebrow: 'Study With Structure',
    title: 'Turn curiosity into steady study',
    description: 'Begin with one text, one question, and one place to return tomorrow so learning feels grounded, not overwhelming.',
    accentClass: 'clay-card-knowledge',
    actions: [
      { label: 'Open Pathshala', href: '/pathshala', icon: '📚' },
      { label: 'Enter Vichaar Sabha', href: '/vichaar-sabha', icon: '💬' },
    ],
  },
  events: {
    eyebrow: 'Show Up In Person',
    title: 'Find what is happening around you',
    description: 'Use the map and festival calendar as your local pulse, then pick one event or mandir to anchor your month.',
    accentClass: 'clay-card-events',
    actions: [
      { label: 'Open Tirtha Map', href: '/tirtha-map', icon: '📍' },
      { label: 'Check Panchang', href: '/panchang', icon: '🪔' },
    ],
  },
  mentorship: {
    eyebrow: 'Ask Better Questions',
    title: 'Find guidance with context',
    description: 'Start with thoughtful questions, trusted reading, and community wisdom before looking for deeper mentorship.',
    accentClass: 'clay-card-mentorship',
    actions: [
      { label: 'Ask in Vichaar Sabha', href: '/vichaar-sabha', icon: '🙏' },
      { label: 'Read in Pathshala', href: '/pathshala', icon: '📖' },
    ],
  },
  youth: {
    eyebrow: 'Start Simply',
    title: 'Keep it relatable and lightweight',
    description: 'Use shorter, friendlier entry points first: simple explanations, local discovery, and one clear next step.',
    accentClass: 'clay-card-youth',
    actions: [
      { label: 'Start beginner Pathshala', href: '/pathshala', icon: '🌱' },
      { label: 'Explore community questions', href: '/vichaar-sabha', icon: '💭' },
    ],
  },
};

// ── Ashrama-specific card definitions ────────────────────────────────────────
const ASHRAMA_CARDS: Record<string, Omit<PersonalizedPath, 'id' | 'badges'>> = {
  brahmacharya: {
    eyebrow: 'Student Stage',
    title: 'Build your foundation',
    description: 'Focus on structured study and daily discipline. One text, one practice, one return each morning.',
    accentClass: 'clay-card-knowledge',
    actions: [
      { label: 'Start a study path', href: '/pathshala', icon: '📖' },
      { label: 'Ask in Vichaar Sabha', href: '/vichaar-sabha', icon: '💬' },
    ],
  },
  grihastha: {
    eyebrow: 'Householder Stage',
    title: 'Integrate dharma with life',
    description: 'Practice within family, work, and community. Small, steady rhythms make the difference.',
    accentClass: 'clay-card-community',
    actions: [
      { label: 'Open Kul', href: '/kul', icon: '❤️' },
      { label: 'Open My Mandali', href: '/mandali', icon: '🏡' },
    ],
  },
  vanaprastha: {
    eyebrow: 'Elder Stage',
    title: 'Share what you have learned',
    description: 'Shift from doing to guiding. Mentorship, wisdom exchange, and deeper study are your path now.',
    accentClass: 'clay-card-mentorship',
    actions: [
      { label: 'Answer in Vichaar Sabha', href: '/vichaar-sabha', icon: '🙏' },
      { label: 'Explore Pathshala', href: '/pathshala', icon: '📚' },
    ],
  },
  sannyasa: {
    eyebrow: 'Renunciate Stage',
    title: 'Deepen your inner practice',
    description: 'Let go of outcomes. Daily japa, sacred study, and being a quiet presence for others.',
    accentClass: 'clay-card-guided',
    actions: [
      { label: 'Open Japa', href: '/bhakti/mala', icon: '📿' },
      { label: 'Study scripture', href: '/pathshala', icon: '📖' },
    ],
  },
};

// ── Tradition-specific card overrides ─────────────────────────────────────────
const TRADITION_CARDS: Record<string, Omit<PersonalizedPath, 'id' | 'badges'>> = {
  sikh: {
    eyebrow: 'Sikh Path',
    title: 'Root yourself in Gurbani',
    description: 'Begin each day with Nitnem, study Guru Granth Sahib, and connect with your local Sangat.',
    accentClass: 'clay-card-knowledge',
    actions: [
      { label: 'Study Gurbani', href: '/pathshala', icon: '🙏' },
      { label: 'Find Sangat', href: '/mandali', icon: '🏡' },
    ],
  },
  buddhist: {
    eyebrow: 'Buddhist Path',
    title: 'Practice the Dhamma daily',
    description: 'Cultivate mindfulness, study the suttas, and find your local Sangha for shared practice.',
    accentClass: 'clay-card-guided',
    actions: [
      { label: 'Study Dhamma', href: '/pathshala', icon: '☸️' },
      { label: 'Find Sangha', href: '/mandali', icon: '🏡' },
    ],
  },
  jain: {
    eyebrow: 'Jain Path',
    title: 'Walk the path of ahimsa',
    description: 'Daily study of Agam, Samayika practice, and community — the three pillars of Jain sadhana.',
    accentClass: 'clay-card-knowledge',
    actions: [
      { label: 'Study Agam', href: '/pathshala', icon: '📖' },
      { label: 'Open Mandali', href: '/mandali', icon: '🏡' },
    ],
  },
};

// Map onboarding goal IDs (saved to seeking column) -> SeekingKey cards
const GOAL_TO_SEEKING: Record<string, SeekingKey> = {
  community:  'community',
  knowledge:  'knowledge',
  events:     'events',
  mentorship: 'mentorship',
  youth:      'youth',
  japa:       'knowledge',
  learning:   'knowledge',
  festivals:  'events',
  family:     'community',
  temples:    'events',
};

function normalizeSeeking(values: string[]): SeekingKey[] {
  const seen   = new Set<SeekingKey>();
  const result: SeekingKey[] = [];
  for (const v of values) {
    const mapped = GOAL_TO_SEEKING[v];
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      result.push(mapped);
    }
  }
  return result;
}

function getDefaultSeeking(spiritualLevel?: string | null): SeekingKey[] {
  if (spiritualLevel === 'jigyasu') return ['knowledge', 'community'];
  if (spiritualLevel === 'sadhaka') return ['events', 'knowledge'];
  return ['community', 'mentorship'];
}

export function buildPersonalizedPaths({
  seeking,
  spiritualLevel,
  city,
  ashrama,
  tradition,
}: BuildPersonalizedPathsOptions): PersonalizedPath[] {
  const normalized = normalizeSeeking(seeking);
  const effectiveSeeking = normalized.length > 0 ? normalized : getDefaultSeeking(spiritualLevel);
  const cards: PersonalizedPath[] = [];
  const isExplicitlyPersonalized = normalized.length > 0;

  // ── 1. Jigyasu (beginner) card — always first ─────────────────────────────
  if (spiritualLevel === 'jigyasu') {
    cards.push({
      id: 'new-to-dharma',
      eyebrow: 'Guided Path',
      title: 'New to dharma?',
      description: 'Begin with one daily text, one beginner-safe question space, and one trusted place to return tomorrow.',
      badges: ['Beginner-friendly', 'First week'],
      accentClass: 'clay-card-guided',
      actions: [
        { label: 'Read today\'s sacred text', href: '/home?focus=shloka', icon: '🪷' },
        { label: 'Browse Vichaar Sabha', href: '/vichaar-sabha', icon: '💬' },
      ],
    });
  }

  // ── 2. City anchor card ───────────────────────────────────────────────────
  if (city) {
    const cityIsEntryPath = normalized.some((value) => value === 'community' || value === 'events');
    cards.push({
      id: 'city-anchor',
      eyebrow: 'Guided Path',
      title: cityIsEntryPath ? `New to ${city}?` : `In ${city} this week`,
      description: cityIsEntryPath
        ? 'Use your city as the anchor: find sacred places nearby, then take one step toward your local Sangam.'
        : 'Let your city guide your next step: check nearby sacred places, community, and one concrete rhythm for the week.',
      badges: cityIsEntryPath ? ['Local discovery', 'Diaspora-friendly'] : ['Local rhythm', 'This week'],
      accentClass: 'clay-card-city',
      actions: [
        { label: 'Find nearby tirthas', href: '/tirtha-map', icon: '🛕' },
        { label: 'Open My Mandali', href: '/mandali', icon: '🏡' },
      ],
    });
  }

  // ── 3. Tradition card — non-Hindu traditions get a tradition-specific card ─
  const normalisedTradition = tradition?.toLowerCase() ?? 'hindu';
  if (normalisedTradition !== 'hindu' && normalisedTradition !== 'other' && TRADITION_CARDS[normalisedTradition]) {
    const def = TRADITION_CARDS[normalisedTradition];
    cards.push({
      id: `seeking-${normalisedTradition}` as PersonalizedPathId,
      ...def,
      badges: ['Your tradition'],
    });
  }

  // ── 4. Ashrama card — life-stage aware ───────────────────────────────────
  const normalisedAshrama = ashrama?.toLowerCase() ?? null;
  if (normalisedAshrama && ASHRAMA_CARDS[normalisedAshrama]) {
    const def = ASHRAMA_CARDS[normalisedAshrama];
    cards.push({
      id: `seeking-${normalisedAshrama}` as PersonalizedPathId,
      ...def,
      badges: [`${normalisedAshrama.charAt(0).toUpperCase() + normalisedAshrama.slice(1)} stage`],
    });
  }

  // ── 5. Seeking cards — from signup preferences ────────────────────────────
  for (const key of effectiveSeeking.slice(0, 2)) {
    const definition = PATH_DEFINITIONS[key];
    cards.push({
      id: `seeking-${key}`,
      ...definition,
      badges: [isExplicitlyPersonalized ? 'Personalized from signup' : 'Suggested next step'],
    });
  }

  const uniqueCards = cards.filter((card, index, current) => current.findIndex((item) => item.id === card.id) === index);

  return uniqueCards.slice(0, 3);
}
