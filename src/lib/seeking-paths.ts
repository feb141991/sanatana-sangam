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
      { label: 'Browse Library', href: '/library', icon: '📚' },
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
      { label: 'Read a foundational text', href: '/library', icon: '📖' },
    ],
  },
  youth: {
    eyebrow: 'Start Simply',
    title: 'Keep it relatable and lightweight',
    description: 'Use shorter, friendlier entry points first: simple explanations, local discovery, and one clear next step.',
    accentClass: 'clay-card-youth',
    actions: [
      { label: 'Read beginner-friendly texts', href: '/library', icon: '🌱' },
      { label: 'Explore community questions', href: '/vichaar-sabha', icon: '💭' },
    ],
  },
};

function normalizeSeeking(values: string[]): SeekingKey[] {
  return values.filter((value): value is SeekingKey =>
    value === 'community' ||
    value === 'knowledge' ||
    value === 'events' ||
    value === 'mentorship' ||
    value === 'youth'
  );
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
}: BuildPersonalizedPathsOptions): PersonalizedPath[] {
  const normalized = normalizeSeeking(seeking);
  const effectiveSeeking = normalized.length > 0 ? normalized : getDefaultSeeking(spiritualLevel);
  const cards: PersonalizedPath[] = [];
  const isExplicitlyPersonalized = normalized.length > 0;

  if (spiritualLevel === 'jigyasu') {
    cards.push({
      id: 'new-to-dharma',
      eyebrow: 'Guided Path',
      title: 'New to dharma?',
      description: 'Begin with one daily text, one beginner-safe question space, and one trusted place to return tomorrow.',
      badges: ['Beginner-friendly', 'First week'],
      accentClass: 'clay-card-guided',
      actions: [
        { label: 'Read today’s sacred text', href: '/home?focus=shloka', icon: '🪷' },
        { label: 'Browse Vichaar Sabha', href: '/vichaar-sabha', icon: '💬' },
      ],
    });
  }

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
