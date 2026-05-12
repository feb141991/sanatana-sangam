export interface BhaktiSound {
  id: string;
  title: string;
  artist: string;
  duration: string;
  type: 'mantra' | 'bhajan' | 'chant';
  deity?: string;
  mood?: string;
  isPremium?: boolean;
  cover?: string;
}

export const CURATED_SOUNDS: BhaktiSound[] = [
  {
    id: 'shiva-tandava-stotram',
    title: 'Shiva Tandava Stotram',
    artist: 'Classical Vedic Chants',
    duration: '09:12',
    type: 'chant',
    deity: 'shiva',
    mood: 'energy',
    isPremium: true,
    cover: '/images/sounds/shiva-tandava.png'
  },
  {
    id: 'gayatri-mantra-classical',
    title: 'Gayatri Mantra',
    artist: 'Sri Ved Vyas Acad.',
    duration: '11:08',
    type: 'mantra',
    mood: 'peace',
    isPremium: false,
    cover: '/images/sounds/gayatri.png'
  },
  {
    id: 'hanuman-chalisa-meditative',
    title: 'Hanuman Chalisa',
    artist: 'Sattvic Soundscapes',
    duration: '07:45',
    type: 'bhajan',
    deity: 'hanuman',
    mood: 'protection',
    isPremium: true,
    cover: '/images/sounds/hanuman-chalisa.png'
  },
  {
    id: 'vishnu-sahasranamam-excerpt',
    title: 'Vishnu Sahasranamam',
    artist: 'Traditional Ghanam',
    duration: '15:20',
    type: 'chant',
    deity: 'vishnu',
    mood: 'wisdom',
    isPremium: true,
    cover: '/images/sounds/vishnu-sahasranamam.png'
  }
];

export const BHAKTI_COLLECTIONS = [
  {
    title: 'Morning Awakening',
    description: 'Sattvic chants to start your day in peace.',
    sounds: ['gayatri-mantra-classical', 'shiva-tandava-stotram']
  },
  {
    title: 'Evening Devotion',
    description: 'Calming Bhajans for twilight reflection.',
    sounds: ['hanuman-chalisa-meditative', 'vishnu-sahasranamam-excerpt']
  }
];
