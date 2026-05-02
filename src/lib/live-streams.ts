export type LiveStreamCategory = 'mandir' | 'katha' | 'satsang';

export interface LiveStream {
  id: string;
  title: string;
  location: string;
  schedule: string;
  category: LiveStreamCategory;
  tradition: string;
  youtubeChannelId?: string;
  youtubeVideoId?: string; // If it's a static 24/7 video id
  thumbnailUrl: string;
}

export const LIVE_STREAMS: LiveStream[] = [
  {
    id: 'vaishno-devi',
    title: 'Vaishno Devi Temple',
    location: 'Katra, Jammu & Kashmir',
    schedule: 'Aarti: 6:20-8:00 AM & 6:20-8:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    // Shraddha MH ONE
    youtubeChannelId: 'UCv_eUa07Pj8Ity2-g-hM19A',
    thumbnailUrl: '/assets/images/heroes/hindu/mahashivratri.webp', // fallback
  },
  {
    id: 'golden-temple',
    title: 'Golden Temple (Harmandir Sahib)',
    location: 'Amritsar, Punjab',
    schedule: 'Live Gurbani Kirtan 24/7',
    category: 'mandir',
    tradition: 'sikh',
    // PTC Punjabi / SGPC
    youtubeChannelId: 'UCFntx0UteAts-JmD1X-2a_w',
    thumbnailUrl: '/assets/images/heroes/sikh/default.webp', // fallback
  },
  {
    id: 'mahakaleshwar',
    title: 'Shri Mahakaleshwar Jyotirlinga',
    location: 'Ujjain, Madhya Pradesh',
    schedule: 'Bhasma Aarti: 4:00-6:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    // Shri Mahakaleshwar Ujjain
    youtubeChannelId: 'UCQ5uQ6sQZ5G9G5g6G8W6w2g',
    thumbnailUrl: '/assets/images/heroes/hindu/shiva-default.webp', // fallback
  },
  {
    id: 'kashi-vishwanath',
    title: 'Shri Kashi Vishwanath Temple',
    location: 'Varanasi, Uttar Pradesh',
    schedule: 'Mangala Aarti: 3:00-4:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeChannelId: 'UCzVvP6GqZ7qZ1z2w2V0o2_w',
    thumbnailUrl: '/assets/images/heroes/hindu/mahashivratri.webp', // fallback
  }
];
