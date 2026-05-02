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
  },
  // ── New additions ─────────────────────────────────────────────
  {
    id: 'tirupati-balaji',
    title: 'Tirupati Balaji (TTD)',
    location: 'Tirupati, Andhra Pradesh',
    schedule: 'Suprabhata Seva: 3:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'oWFK4tgjAGM', // Verified Tirupati Balaji
  },
  {
    id: 'siddhivinayak',
    title: 'Siddhivinayak Temple',
    location: 'Mumbai, Maharashtra',
    schedule: 'Aarti: 6:00 AM & 7:30 PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'SIqmLnMj0Ow', // Verified Siddhivinayak
  },
  {
    id: 'kashi-vishwanath',
    title: 'Kashi Vishwanath Dham',
    location: 'Varanasi, UP',
    schedule: 'Mangala Aarti: 3:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'CxXJsVLDJko', // Verified Kashi Vishwanath
  },
  {
    id: 'golden-temple-sgpc',
    title: 'Golden Temple (SGPC Official)',
    location: 'Amritsar, Punjab',
    schedule: 'Live Gurbani Kirtan 24/7',
    category: 'mandir',
    tradition: 'sikh',
    youtubeVideoId: '8GTgg2TmRLQ', // Verified SGPC Official
  },
  {
    id: 'shirdi-sai-baba-temple',
    title: 'Shirdi Sai Baba Temple',
    location: 'Shirdi, Maharashtra',
    schedule: 'Live Darshan 24/7',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'HbVd7a7esgA', // Verified Shirdi Darshan
  },
  {
    id: 'puri-jagannath',
    title: 'Shri Jagannath Puri',
    location: 'Puri, Odisha',
    schedule: 'Live Darshan from Puri Dham',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: '_pplsMPNVmQ', // Verified Jay Jagannath TV
  },
  {
    id: 'kedarnath-temple',
    title: 'Kedarnath Temple',
    location: 'Rudraprayag, Uttarakhand',
    schedule: 'Sandhya Aarti: 6:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: '3oJdFVXsC-o', // Verified Kedarnath Live
  },
  {
    id: 'badrinath-temple',
    title: 'Shri Badrinath Temple',
    location: 'Chamoli, Uttarakhand',
    schedule: 'Abhishek Puja: 4:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'yGELQ2Ch-q4', // Verified Badrinath Live
  },
  {
    id: 'somnath-temple',
    title: 'Shri Somnath Temple',
    location: 'Junagadh, Gujarat',
    schedule: 'Aarti: 7:00 AM, 12:00 PM, 7:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'J4z7CIrvsuw', // Verified Somnath Live
  },
  {
    id: 'swaminarayan-kundaldham',
    title: 'Swaminarayan Kundaldham',
    location: 'Rajkot, Gujarat',
    schedule: 'Live Satsang 24/7',
    category: 'satsang',
    tradition: 'hindu',
    youtubeVideoId: 'u9SEkGgmEbo', // Verified Swaminarayan Kundaldham
  },
  {
    id: 'hazoori-ragi-kirtan',
    title: 'Hazoori Ragi Gurbani Kirtan',
    location: 'Punjab',
    schedule: 'Akhand Kirtan 24/7',
    category: 'satsang',
    tradition: 'sikh',
    youtubeVideoId: 'SfkiRiVr3wc', // Verified Hazoori Ragi
  },
  {
    id: 'nathdwara-shrinathji',
    title: 'Nathdwara Shrinathji',
    location: 'Nathdwara, Rajasthan',
    schedule: 'Jhanki Darshan',
    category: 'mandir',
    tradition: 'hindu',
    youtubeVideoId: 'jpTOa9PVaTc', // Verified Nathdwara
  },
];
