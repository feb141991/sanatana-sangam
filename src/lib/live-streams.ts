export type LiveStreamCategory = 'mandir' | 'katha' | 'satsang';

export interface LiveStream {
  id: string;
  title: string;
  location: string;
  schedule: string;
  category: LiveStreamCategory;
  tradition: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
}

export const LIVE_STREAMS: LiveStream[] = [
  {
    id: 'vaishno-devi',
    title: 'Vaishno Devi Temple',
    location: 'Katra, Jammu & Kashmir',
    schedule: 'Aarti: 6:20-8:00 AM & PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'F2ndo7e0_UY',
    thumbnailUrl: '/assets/images/heroes/hindu/mahashivratri.webp',
  },
  {
    id: 'golden-temple',
    title: 'Golden Temple',
    location: 'Amritsar, Punjab',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    youtubeVideoId: 'QSbluRNQANE',
    thumbnailUrl: '/assets/images/heroes/sikh/default.webp',
  },
  {
    id: 'mahakaleshwar',
    title: 'Shri Mahakaleshwar',
    location: 'Ujjain, Madhya Pradesh',
    schedule: 'Bhasma Aarti: 4:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'pq5KZ6yRZCw',
    thumbnailUrl: '/assets/images/heroes/hindu/shiva-default.webp',
  },
  {
    id: 'kashi-vishwanath',
    title: 'Kashi Vishwanath',
    location: 'Varanasi, UP',
    schedule: 'Mangala Aarti: 3:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'oLhzzZkKRWE',
    thumbnailUrl: '/assets/images/heroes/hindu/mahashivratri.webp',
  },
  {
    id: 'somnath',
    title: 'Shri Somnath Temple',
    location: 'Prabhas Patan, Gujarat',
    schedule: 'Aarti: 7:00 AM, 12:00 PM, 7:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'SrDCZCWmz1U',
    thumbnailUrl: '/assets/images/heroes/hindu/shiva-default.webp',
  },
  {
    id: 'bageshwar-dham',
    title: 'Shri Bageshwar Dham',
    location: 'Chhatarpur, MP',
    schedule: 'Live Divya Darbar & Katha',
    category: 'katha',
    tradition: 'hindu',
    youtubeVideoId: '59MySSkC_to',
    thumbnailUrl: '/assets/images/heroes/hindu/default.webp',
  },
  {
    id: 'prem-mandir',
    title: 'Prem Mandir',
    location: 'Vrindavan, UP',
    schedule: 'Live Darshan 24/7',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'TzhPxCnmWrw',
    thumbnailUrl: '/assets/images/heroes/hindu/default.webp',
  }
];
