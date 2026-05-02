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
    id: 'krishna-janmabhoomi',
    title: 'Shri Krishna Janmabhoomi',
    location: 'Mathura, UP',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'ZCXCu9_K0lY', // Verified Mathura Janmabhoomi
  },
  {
    id: 'mahakaleshwar-ujjain',
    title: 'Shri Mahakaleshwar',
    location: 'Ujjain, Madhya Pradesh',
    schedule: 'Bhasma Aarti: 4:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'XonAtRkvqgo', // Verified Mahakaleshwar
  },
  {
    id: 'takhat-hazur-sahib',
    title: 'Takhat Sachkhand Hazur Sahib',
    location: 'Nanded, Maharashtra',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    youtubeVideoId: 'YsI5XOB4z7g', // Verified Sikh Darshan
  },
  {
    id: 'iskcon-hare-krishna',
    title: 'ISKCON Hare Krishna',
    location: 'Global',
    schedule: 'Akhand Kirtan 24/7',
    category: 'satsang',
    tradition: 'hindu',
    youtubeVideoId: 'Y1SrWeVhQJ0', // Verified Prabhupada Kirtan
  },
  {
    id: 'shantikunj-haridwar',
    title: 'Shantikunj Gayatri Teerth',
    location: 'Haridwar, Uttarakhand',
    schedule: 'Live Darshan 24/7',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'F2ndo7e0_UY', // Verified Shantikunj
  },
  {
    id: 'swaminarayan-dhun',
    title: 'Swaminarayan Akhand Dhun',
    location: 'Gujarat',
    schedule: 'Live Dhyan Dhun 24/7',
    category: 'satsang',
    tradition: 'hindu',
    youtubeVideoId: '185-4L8sIVY', // Verified Swaminarayan
  },
  {
    id: 'sai-baba-dhyan',
    title: 'Shirdi Sai Baba',
    location: 'Shirdi, Maharashtra',
    schedule: 'Sai Naam Jap 24/7',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: '67nkcpEwCDo', // Verified Sai Baba
  },
  {
    id: 'shiva-mahamrityunjay',
    title: 'Shiva Mahamrityunjay',
    location: 'Kashi',
    schedule: 'Live Mantra Chanting',
    category: 'katha',
    tradition: 'hindu',
    youtubeVideoId: 'YmwC_vNkkA4', // Verified Shiva Mantra
  },
  {
    id: 'brahma-kumaris',
    title: 'Brahma Kumaris Madhuban',
    location: 'Mount Abu, Rajasthan',
    schedule: 'Baba Room Darshan',
    category: 'satsang',
    tradition: 'hindu',
    youtubeVideoId: 'KmQrxaRSurQ', // Verified Brahma Kumaris
  }
];
