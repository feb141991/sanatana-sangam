export interface MoodRecommendation {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  type: 'stotram' | 'katha' | 'dhyana' | 'discover' | 'japa' | 'pathshala';
  icon: string;
  explanation?: string;
}

export const MOOD_RECOMMENDATION_MAP: Record<string, MoodRecommendation[]> = {
  grateful: [
    {
      id: 'ganesha-pancharatnam',
      title: 'Ganesha Pancharatnam',
      description: 'Chant this 5-verse stotram to express your gratitude and begin your day well.',
      actionLabel: 'Chant Now',
      href: '/bhakti/stotram/ganesha-pancharatnam',
      type: 'stotram',
      icon: '🙏',
      explanation: 'Expressing gratitude through chanting creates a lasting positive vibration.',
    },
    {
      id: 'dhyana-gratitude',
      title: 'Gratitude Reflection',
      description: 'Sit in silence and acknowledge the blessings in your life.',
      actionLabel: 'Meditate',
      href: '/pathshala/dhyana',
      type: 'dhyana',
      icon: '🧘',
      explanation: 'Silent reflection deepens the feeling of thankfulness in your core.',
    },
    {
      id: 'katha-sudama',
      title: 'Krishna & Sudama',
      description: 'Read the beautiful story of true friendship and unspoken gratitude.',
      actionLabel: 'Read',
      href: '/bhakti/katha/krishna-sudama',
      type: 'katha',
      icon: '🦚',
      explanation: 'This story perfectly captures the essence of divine grace and gratitude.',
    },
    {
      id: 'japa-om',
      title: 'Om Japa',
      description: 'Chant the primordial sound to align with the universe.',
      actionLabel: 'Start Japa',
      href: '/japa',
      type: 'japa',
      icon: '📿',
      explanation: 'A simple japa helps anchor your joyful energy.',
    },
    {
      id: 'pathshala-dharma',
      title: 'Dharma & Duty',
      description: 'Explore verses on living a life of purpose.',
      actionLabel: 'Learn',
      href: '/pathshala',
      type: 'pathshala',
      icon: '📖',
      explanation: 'When grateful, learning about dharma gives direction to your energy.',
    },
    {
      id: 'discover-peace',
      title: 'Bhakti Collection',
      description: 'Listen to devotional chants to deepen your feeling of gratitude.',
      actionLabel: 'Listen',
      href: '/discover',
      type: 'discover',
      icon: '🎵',
      explanation: 'Music is the most natural expression of a grateful heart.',
    },
  ],
  seeking: [
    {
      id: 'pathshala-wisdom',
      title: 'Upanishadic Wisdom',
      description: 'Explore curated shlokas and knowledge to find your answers.',
      actionLabel: 'Explore',
      href: '/pathshala',
      type: 'pathshala',
      icon: '📖',
      explanation: 'The Upanishads are designed precisely for seekers of truth.',
    },
    {
      id: 'katha-ramayana',
      title: 'Ramayana Katha',
      description: 'Find answers through the timeless stories of Lord Rama.',
      actionLabel: 'Read',
      href: '/bhakti/katha/ramayana',
      type: 'katha',
      icon: '🏹',
      explanation: 'Lord Rama’s life provides practical answers to complex moral dilemmas.',
    },
    {
      id: 'dhyana-inquiry',
      title: 'Self-Inquiry',
      description: 'Turn your seeking inward with guided reflection.',
      actionLabel: 'Meditate',
      href: '/pathshala/dhyana',
      type: 'dhyana',
      icon: '🧘',
      explanation: 'Sometimes the answers you seek are already within you.',
    },
    {
      id: 'stotram-guru',
      title: 'Guru Stotram',
      description: 'Invoke the guidance of the spiritual master.',
      actionLabel: 'Chant',
      href: '/bhakti/stotram/guru-stotram',
      type: 'stotram',
      icon: '🙏',
      explanation: 'Honoring the Guru principle opens the mind to receiving knowledge.',
    },
    {
      id: 'japa-gayatri',
      title: 'Gayatri Japa',
      description: 'Chant for illumination and clarity of mind.',
      actionLabel: 'Start Japa',
      href: '/japa',
      type: 'japa',
      icon: '📿',
      explanation: 'The Gayatri mantra specifically prays for an illuminated intellect.',
    },
    {
      id: 'discover',
      title: 'Discover Scripture',
      description: 'Browse the library for verses that speak to your condition.',
      actionLabel: 'Explore',
      href: '/discover',
      type: 'discover',
      icon: '🌿',
      explanation: 'A broad search can often spark unexpected insights.',
    },
  ],
  anxious: [
    {
      id: 'hanuman-chalisa',
      title: 'Hanuman Chalisa',
      description: 'Find courage and dispel anxiety with this powerful chant.',
      actionLabel: 'Chant',
      href: '/bhakti/stotram/hanuman-chalisa',
      type: 'stotram',
      icon: '💪',
      explanation: 'Lord Hanuman represents absolute strength and freedom from fear.',
    },
    {
      id: 'dhyana-breath',
      title: 'Mindful Breathing',
      description: 'Take a few minutes to center yourself and calm your mind.',
      actionLabel: 'Practice',
      href: '/pathshala/dhyana',
      type: 'dhyana',
      icon: '🧘',
      explanation: 'Slowing the breath immediately calms the nervous system.',
    },
    {
      id: 'japa-shiva',
      title: 'Panchakshari Japa',
      description: 'Chant Om Namah Shivaya to find inner stillness.',
      actionLabel: 'Start Japa',
      href: '/japa',
      type: 'japa',
      icon: '📿',
      explanation: 'Rhythmic repetition provides an anchor for an anxious mind.',
    },
    {
      id: 'katha-gajendra',
      title: 'Gajendra Moksha',
      description: 'Read the story of surrender when all seems lost.',
      actionLabel: 'Read',
      href: '/bhakti/katha/gajendra-moksha',
      type: 'katha',
      icon: '🐘',
      explanation: 'This story teaches that ultimate surrender brings divine protection.',
    },
    {
      id: 'pathshala-gita',
      title: 'Gita on Action',
      description: 'Learn how to act without attachment to results.',
      actionLabel: 'Learn',
      href: '/pathshala',
      type: 'pathshala',
      icon: '📖',
      explanation: 'Anxiety often comes from worrying about the future; the Gita teaches focus on the present.',
    },
    {
      id: 'discover-calm',
      title: 'Calming Chants',
      description: 'Listen to soothing mantras to settle your spirit.',
      actionLabel: 'Listen',
      href: '/discover',
      type: 'discover',
      icon: '🎵',
      explanation: 'Sound vibrations have a direct calming effect on the mind.',
    },
  ],
  joyful: [
    {
      id: 'shiva-tandava',
      title: 'Shiva Tandava Stotram',
      description: 'Channel your energy and joy with the vigorous Shiva Tandava.',
      actionLabel: 'Chant',
      href: '/bhakti/stotram/shiva-tandava-stotram',
      type: 'stotram',
      icon: '🔱',
      explanation: 'This stotram matches your high energy with its powerful rhythm.',
    },
    {
      id: 'katha-krishna',
      title: 'Krishna Leela',
      description: 'Celebrate your joy with the playful stories of Lord Krishna.',
      actionLabel: 'Read',
      href: '/bhakti/katha/krishna-leela',
      type: 'katha',
      icon: '🦚',
      explanation: 'Lord Krishna is the embodiment of divine bliss and playfulness.',
    },
    {
      id: 'japa-harekrishna',
      title: 'Mahamantra Japa',
      description: 'Chant and celebrate the names of the divine.',
      actionLabel: 'Start Japa',
      href: '/japa',
      type: 'japa',
      icon: '📿',
      explanation: 'Joy naturally flows outward in the form of divine names.',
    },
    {
      id: 'dhyana-metta',
      title: 'Radiating Joy',
      description: 'Share your positive energy with the world through meditation.',
      actionLabel: 'Meditate',
      href: '/pathshala/dhyana',
      type: 'dhyana',
      icon: '🧘',
      explanation: 'Joy grows when it is shared intentionally with others.',
    },
    {
      id: 'pathshala-bhakti',
      title: 'Path of Devotion',
      description: 'Explore the philosophy of Bhakti.',
      actionLabel: 'Learn',
      href: '/pathshala',
      type: 'pathshala',
      icon: '📖',
      explanation: 'Understanding the roots of devotion gives depth to your joy.',
    },
    {
      id: 'discover-celebrate',
      title: 'Celebration Collection',
      description: 'Upbeat bhajans and kirtans to elevate your mood.',
      actionLabel: 'Listen',
      href: '/discover',
      type: 'discover',
      icon: '🎵',
      explanation: 'Music amplifies a joyous state of mind.',
    },
  ],
  scattered: [
    {
      id: 'dhyana-focus',
      title: 'Trataka Dhyana',
      description: 'Focus your mind and gather your thoughts with a short meditation.',
      actionLabel: 'Meditate',
      href: '/pathshala/dhyana',
      type: 'dhyana',
      icon: '👁️',
      explanation: 'A single point of focus brings scattered thoughts together.',
    },
    {
      id: 'vishnu-sahasranamam',
      title: 'Vishnu Sahasranamam',
      description: 'Bring order to a scattered mind by listening to the 1000 names.',
      actionLabel: 'Listen',
      href: '/bhakti/stotram/vishnu-sahasranamam',
      type: 'stotram',
      icon: '🐚',
      explanation: 'The structured discipline of 1000 names trains the mind to stay attentive.',
    },
    {
      id: 'japa-mala',
      title: 'Bead Practice',
      description: 'Use the tactile feedback of a mala to stay present.',
      actionLabel: 'Start Japa',
      href: '/japa',
      type: 'japa',
      icon: '📿',
      explanation: 'Physical movement combined with mantra grounds a wandering mind.',
    },
    {
      id: 'pathshala-yoga',
      title: 'Yoga Sutras',
      description: 'Learn Patanjali\'s teachings on controlling the fluctuations of the mind.',
      actionLabel: 'Learn',
      href: '/pathshala',
      type: 'pathshala',
      icon: '📖',
      explanation: 'Understanding the mechanics of the mind helps you regain control.',
    },
    {
      id: 'katha-dhruva',
      title: 'Story of Dhruva',
      description: 'Read about the ultimate example of unwavering determination.',
      actionLabel: 'Read',
      href: '/bhakti/katha/dhruva',
      type: 'katha',
      icon: '🌟',
      explanation: 'Dhruva’s singular focus is the antidote to scattered energy.',
    },
    {
      id: 'discover-focus',
      title: 'Focus Collection',
      description: 'Explore chants specifically designed to aid concentration.',
      actionLabel: 'Explore',
      href: '/discover',
      type: 'discover',
      icon: '🌿',
      explanation: 'Targeted practices can help rebuild your attention span.',
    },
  ],
};

// Fallback for missing moods
const DEFAULT_MOOD = 'seeking';

export interface MoodContext {
  need?: string | null;
  time?: string | null;
  type?: string | null;
}

export interface MoodHistory {
  clicked_action?: string | null;
  completed_action?: string | null;
  skipped_actions?: string[] | null;
}

export function getRecommendationsForMood(moodKey: string, context?: MoodContext): MoodRecommendation[] {
  const fullStack = getFullRecommendationsForMood(moodKey, context);
  // Maintain backward compatibility for the home sheet (which only shows 2)
  return fullStack.slice(0, 2);
}

export function rankPersonalizedRecommendations(
  baseRecs: MoodRecommendation[],
  history?: MoodHistory[]
): MoodRecommendation[] {
  if (!history || history.length === 0) return baseRecs;

  const scoreMap: Record<string, number> = {};
  
  // Initialize scores
  baseRecs.forEach(r => scoreMap[r.type] = 0);

  // Calculate scores from history
  history.forEach(h => {
    if (h.clicked_action) {
      scoreMap[h.clicked_action] = (scoreMap[h.clicked_action] || 0) + 2;
    }
    if (h.completed_action) {
      scoreMap[h.completed_action] = (scoreMap[h.completed_action] || 0) + 3;
    }
    if (h.skipped_actions && Array.isArray(h.skipped_actions)) {
      h.skipped_actions.forEach((skippedType: string) => {
        scoreMap[skippedType] = (scoreMap[skippedType] || 0) - 1;
      });
    }
  });

  // Sort baseRecs by score descending (stable sort approach)
  return [...baseRecs].sort((a, b) => {
    const diff = (scoreMap[b.type] || 0) - (scoreMap[a.type] || 0);
    return diff !== 0 ? diff : 0;
  });
}

export function getFullRecommendationsForMood(moodKey: string, context?: MoodContext, history?: MoodHistory[]): MoodRecommendation[] {
  const baseRecs = MOOD_RECOMMENDATION_MAP[moodKey] || MOOD_RECOMMENDATION_MAP[DEFAULT_MOOD];
  
  // First, apply personalization ranking based on history
  let rankedRecs = rankPersonalizedRecommendations(baseRecs, history);
  
  if (!context || !context.type) {
    return rankedRecs;
  }

  // If we have an explicit type preference for this session, it overrides historical ranking for the top spots
  const typeMap: Record<string, string[]> = {
    'read': ['katha', 'pathshala'],
    'chant': ['stotram', 'japa'],
    'listen': ['stotram', 'discover'],
    'reflect': ['dhyana']
  };

  const preferredTypes = typeMap[context.type] || [];
  
  if (preferredTypes.length === 0) {
    return rankedRecs;
  }

  // Partition the array into matching types and non-matching types
  const primary = rankedRecs.filter(r => preferredTypes.includes(r.type));
  const secondary = rankedRecs.filter(r => !preferredTypes.includes(r.type));

  return [...primary, ...secondary];
}
