export type LiveStreamCategory = 'mandir' | 'katha' | 'satsang';

export interface LiveStream {
  id: string;
  title: string;
  location: string;
  schedule: string;
  category: LiveStreamCategory;
  tradition: string;
  youtubeVideoId: string;
  thumbnailUrl?: string; // Kept for backwards compatibility, but we use ytimg dynamically now
}

export const LIVE_STREAMS: LiveStream[] = [
  {
    id: 'vaishno-devi-live',
    title: 'Vaishno Devi Temple',
    location: 'Katra, Jammu & Kashmir',
    schedule: 'Aarti: 6:20-8:00 AM & PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'F2ndo7e0_UY',
  },
  {
    id: 'golden-temple-live',
    title: 'Golden Temple (Harmandir Sahib)',
    location: 'Amritsar, Punjab',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    youtubeVideoId: 'Y1SrWeVhQJ0', // Working Sikh Darshan
  },
  {
    id: 'mahakaleshwar-ujjain',
    title: 'Shri Mahakaleshwar',
    location: 'Ujjain, Madhya Pradesh',
    schedule: 'Bhasma Aarti: 4:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'pq5KZ6yRZCw',
  },
  {
    id: 'salasar-balaji',
    title: 'Salasar Balaji Mandir',
    location: 'Salasar, Rajasthan',
    schedule: 'Aarti: 5:00 AM & 7:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'Zc-ropvRpsE',
  },
  {
    id: 'iskcon-vrindavan',
    title: 'ISKCON Vrindavan',
    location: 'Vrindavan, UP',
    schedule: 'Live Darshan & Kirtan',
    category: 'satsang',
    tradition: 'hindu',
    youtubeVideoId: '185-4L8sIVY',
  },
  {
    id: 'bageshwar-dham',
    title: 'Shri Bageshwar Dham',
    location: 'Chhatarpur, MP',
    schedule: 'Live Divya Darbar',
    category: 'katha',
    tradition: 'hindu',
    youtubeVideoId: '59MySSkC_to',
  },
  {
    id: 'ram-mandir-ayodhya',
    title: 'Shri Ram Janmabhoomi',
    location: 'Ayodhya, UP',
    schedule: 'Aarti & Darshan',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: '0mlExLaEBDQ', 
  },
  {
    id: 'somnath-temple',
    title: 'Shri Somnath Temple',
    location: 'Prabhas Patan, Gujarat',
    schedule: 'Aarti: 7:00 AM, 12:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'BMzwpfM7D9k',
  },
  {
    id: 'khatu-shyam',
    title: 'Khatu Shyam Ji',
    location: 'Sikar, Rajasthan',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: '67nkcpEwCDo',
  },
  {
    id: 'govind-dev-ji',
    title: 'Govind Dev Ji Temple',
    location: 'Jaipur, Rajasthan',
    schedule: 'Jhanki Darshan',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'Cb0fEltprZY',
  },
  {
    id: 'jhandewalan-mata',
    title: 'Jhandewalan Mata Mandir',
    location: 'New Delhi',
    schedule: 'Live Aarti & Darshan',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'KmQrxaRSurQ',
  },
  {
    id: 'shree-swaminarayan',
    title: 'Swaminarayan Temple',
    location: 'Bhuj, Gujarat',
    schedule: 'Live Darshan 24/7',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'XonAtRkvqgo',
  }
];
