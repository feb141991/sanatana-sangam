export interface MoodRecommendation {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  type: 'stotram' | 'katha' | 'dhyana' | 'discover';
  icon: string;
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
    },
    {
      id: 'discover-peace',
      title: 'Bhakti Collection',
      description: 'Listen to devotional chants to deepen your feeling of gratitude.',
      actionLabel: 'Listen',
      href: '/discover',
      type: 'discover',
      icon: '🎵',
    },
  ],
  seeking: [
    {
      id: 'discover',
      title: 'Discover Scripture',
      description: 'Explore curated shlokas, verses, and knowledge to find your answers.',
      actionLabel: 'Explore',
      href: '/discover',
      type: 'discover',
      icon: '📖',
    },
    {
      id: 'katha-ramayana',
      title: 'Ramayana Katha',
      description: 'Find answers through the timeless stories of Lord Rama.',
      actionLabel: 'Read',
      href: '/bhakti/katha/ramayana',
      type: 'katha',
      icon: '🏹',
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
    },
    {
      id: 'dhyana-breath',
      title: 'Mindful Breathing',
      description: 'Take a few minutes to center yourself and calm your mind.',
      actionLabel: 'Practice',
      href: '/pathshala/dhyana',
      type: 'dhyana',
      icon: '🧘',
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
    },
    {
      id: 'katha-krishna',
      title: 'Krishna Leela',
      description: 'Celebrate your joy with the playful stories of Lord Krishna.',
      actionLabel: 'Read',
      href: '/bhakti/katha/krishna-leela',
      type: 'katha',
      icon: '🦚',
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
    },
    {
      id: 'vishnu-sahasranamam',
      title: 'Vishnu Sahasranamam',
      description: 'Bring order to a scattered mind by listening to the 1000 names.',
      actionLabel: 'Listen',
      href: '/bhakti/stotram/vishnu-sahasranamam',
      type: 'stotram',
      icon: '🐚',
    },
  ],
};

export function getRecommendationsForMood(moodKey: string): MoodRecommendation[] {
  return MOOD_RECOMMENDATION_MAP[moodKey] || MOOD_RECOMMENDATION_MAP['seeking'];
}
