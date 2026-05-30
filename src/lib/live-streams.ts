export type LiveStreamCategory = 'mandir' | 'katha' | 'satsang';

export interface AartiSchedule {
  /** Human-readable time for morning aarti, e.g. "4:00 AM" */
  morning?: string;
  /** Human-readable time for evening aarti, e.g. "7:00 PM" */
  evening?: string;
}

export interface LiveStream {
  id: string;
  title: string;
  location: string;
  schedule: string;
  category: LiveStreamCategory;
  tradition: string;
  youtubeVideoId: string;
  ishtaDevata?: string;
  state?: string;
  collections?: string[];
  thumbnailUrl?: string;
  /** Parsed aarti times for notification scheduling */
  aartis?: AartiSchedule;
}

/**
 * Curated aarti times keyed by stream ID.
 * Morning = first aarti (Mangal/Bhasma/Suprabhata).
 * Evening = Sandhya/evening aarti.
 */
export const AARTI_TIMES: Record<string, AartiSchedule> = {
  'mahakaleshwar-ujjain':    { morning: '4:00 AM — Bhasma Aarti' },
  'kashi-vishwanath':        { morning: '3:00 AM — Mangal Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'kedarnath-temple':        { morning: '5:00 AM — Abhishek Puja', evening: '6:00 PM — Sandhya Aarti' },
  'badrinath-temple':        { morning: '4:30 AM — Abhishek Puja', evening: '8:00 PM — Sandhya Aarti' },
  'tirupati-balaji':         { morning: '3:00 AM — Suprabhata Seva' },
  'siddhivinayak':           { morning: '6:00 AM — Aarti', evening: '7:30 PM — Aarti' },
  'somnath-temple':          { morning: '7:00 AM — Pratah Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'puri-jagannath':          { morning: '5:00 AM — Mangal Aarti', evening: '8:00 PM — Sandhya Aarti' },
  'iskcon-vrindavan':        { morning: '4:30 AM — Mangal Aarti', evening: '8:00 PM — Aarti' },
  'dwarkadhish-temple':      { morning: '6:30 AM — Mangal Aarti', evening: '7:30 PM — Sandhya Aarti' },
  'ayodhya-ram-mandir':      { morning: '5:30 AM — Mangal Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'sankat-mochan-hanuman':   { morning: '5:00 AM — Mangal Aarti', evening: '7:30 PM — Bhajan Sandhya' },
  'nathdwara-shrinathji':    { morning: '6:00 AM — Mangal Jhanki', evening: '7:30 PM — Sandhya Jhanki' },
  'srisailam-temple':        { morning: '5:00 AM — Prakasha Darshan', evening: '6:30 PM — Sandhya Deepalankarana' },
  'mahalakshmi-kolhapur':    { morning: '6:00 AM — Kakad Aarti', evening: '6:00 PM — Sandhya Aarti' },
  'kamakhya-temple-live':    { morning: '5:30 AM — Pratah Darshan' },
  'iskcon-mayapur':          { morning: '4:30 AM — Mangal Aarti', evening: '8:00 PM — Gaura Aarti' },
  'iskcon-bangalore':        { morning: '4:30 AM — Mangal Aarti', evening: '8:00 PM — Sandhya Aarti' },
  'vrindavan-chandrodaya':   { morning: '5:15 AM — Mangal Aarti', evening: '7:30 PM — Sandhya Aarti' },
  'pashupatinath-nepal':     { morning: '5:00 AM — Pratah Darshan', evening: '6:00 PM — Sandhya Aarti' },
  'krishna-janmabhoomi':     { morning: '5:00 AM — Mangal Aarti', evening: '7:30 PM — Sandhya Aarti' },
};

export const LIVE_STREAMS: LiveStream[] = [
  {
    id: 'krishna-janmabhoomi',
    title: 'Shri Krishna Janmabhoomi',
    location: 'Mathura, UP',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Uttar Pradesh',
    collections: ['Saptapuri'],
    youtubeVideoId: 'ZCXCu9_K0lY', // Verified Mathura Janmabhoomi
  },
  {
    id: 'mahakaleshwar-ujjain',
    title: 'Shri Mahakaleshwar',
    location: 'Ujjain, Madhya Pradesh',
    schedule: 'Bhasma Aarti: 4:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shiva',
    state: 'Madhya Pradesh',
    collections: ['Jyotirlinga', 'Saptapuri'],
    youtubeVideoId: 'XonAtRkvqgo', // Verified Mahakaleshwar
  },
  {
    id: 'takhat-hazur-sahib',
    title: 'Takhat Sachkhand Hazur Sahib',
    location: 'Nanded, Maharashtra',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Maharashtra',
    collections: ['Panj Takht'],
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
    ishtaDevata: 'Vishnu',
    state: 'Andhra Pradesh',
    collections: ['Char Dham'],
    youtubeVideoId: 'oWFK4tgjAGM', // Verified Tirupati Balaji
  },
  {
    id: 'siddhivinayak',
    title: 'Siddhivinayak Temple',
    location: 'Mumbai, Maharashtra',
    schedule: 'Aarti: 6:00 AM & 7:30 PM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Ganesha',
    state: 'Maharashtra',
    youtubeVideoId: 'SIqmLnMj0Ow', // Verified Siddhivinayak
  },
  {
    id: 'kashi-vishwanath',
    title: 'Kashi Vishwanath Dham',
    location: 'Varanasi, UP',
    schedule: 'Mangala Aarti: 3:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shiva',
    state: 'Uttar Pradesh',
    collections: ['Jyotirlinga', 'Saptapuri', 'Rivers'],
    youtubeVideoId: 'CxXJsVLDJko', // Verified Kashi Vishwanath
  },
  {
    id: 'golden-temple-sgpc',
    title: 'Golden Temple (SGPC Official)',
    location: 'Amritsar, Punjab',
    schedule: 'Live Gurbani Kirtan 24/7',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Panj Takht'],
    youtubeVideoId: '8GTgg2TmRLQ', // Verified SGPC Official
  },
  {
    id: 'shirdi-sai-baba-temple',
    title: 'Shirdi Sai Baba Temple',
    location: 'Shirdi, Maharashtra',
    schedule: 'Live Darshan 24/7',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Sai Baba',
    state: 'Maharashtra',
    youtubeVideoId: 'HbVd7a7esgA', // Verified Shirdi Darshan
  },
  {
    id: 'puri-jagannath',
    title: 'Shri Jagannath Puri',
    location: 'Puri, Odisha',
    schedule: 'Live Darshan from Puri Dham',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Jagannath',
    state: 'Odisha',
    collections: ['Char Dham', 'Shaktipeeth'],
    youtubeVideoId: '_pplsMPNVmQ', // Verified Jay Jagannath TV
  },
  {
    id: 'kedarnath-temple',
    title: 'Kedarnath Temple',
    location: 'Rudraprayag, Uttarakhand',
    schedule: 'Sandhya Aarti: 6:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shiva',
    state: 'Uttarakhand',
    collections: ['Jyotirlinga', 'Chota Char Dham'],
    youtubeVideoId: '3oJdFVXsC-o', // Verified Kedarnath Live
  },
  {
    id: 'badrinath-temple',
    title: 'Shri Badrinath Temple',
    location: 'Chamoli, Uttarakhand',
    schedule: 'Abhishek Puja: 4:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Vishnu',
    state: 'Uttarakhand',
    collections: ['Char Dham', 'Chota Char Dham'],
    youtubeVideoId: 'yGELQ2Ch-q4', // Verified Badrinath Live
  },
  {
    id: 'somnath-temple',
    title: 'Shri Somnath Temple',
    location: 'Junagadh, Gujarat',
    schedule: 'Aarti: 7:00 AM, 12:00 PM, 7:00 PM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shiva',
    state: 'Gujarat',
    collections: ['Jyotirlinga'],
    youtubeVideoId: 'J4z7CIrvsuw', // Verified Somnath Live
  },
  {
    id: 'swaminarayan-kundaldham',
    title: 'Swaminarayan Kundaldham',
    location: 'Rajkot, Gujarat',
    schedule: 'Live Satsang 24/7',
    category: 'satsang',
    tradition: 'hindu',
    ishtaDevata: 'Swaminarayan',
    state: 'Gujarat',
    youtubeVideoId: 'u9SEkGgmEbo', // Verified Swaminarayan Kundaldham
  },
  {
    id: 'hazoori-ragi-kirtan',
    title: 'Hazoori Ragi Gurbani Kirtan',
    location: 'Punjab',
    schedule: 'Akhand Kirtan 24/7',
    category: 'satsang',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'SfkiRiVr3wc', // Verified Hazoori Ragi
  },
  {
    id: 'nathdwara-shrinathji',
    title: 'Nathdwara Shrinathji',
    location: 'Nathdwara, Rajasthan',
    schedule: 'Jhanki Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Rajasthan',
    youtubeVideoId: 'jpTOa9PVaTc', // Verified Nathdwara
  },
  {
    id: 'iskcon-vrindavan',
    title: 'ISKCON Vrindavan',
    location: 'Vrindavan, UP',
    schedule: 'Mangal Aarti: 4:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Uttar Pradesh',
    youtubeVideoId: 'zs6j9YPeaec', // Verified ISKCON Vrindavan
  },
  {
    id: 'vrindavan-chandrodaya',
    title: 'Vrindavan Chandrodaya Mandir',
    location: 'Vrindavan, UP',
    schedule: 'Mangala Aarti: 5:15 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Uttar Pradesh',
    youtubeVideoId: 'IEejiL_7g4c',
  },
  {
    id: 'srisailam-temple',
    title: 'Srisailam Shaktipeeth',
    location: 'Andhra Pradesh',
    schedule: 'Live Darshan & Aarti',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shakti',
    state: 'Andhra Pradesh',
    collections: ['Jyotirlinga', 'Shaktipeeth'],
    youtubeVideoId: 'zc3tcDcD9Ig', // Verified Srisailam
  },
  {
    id: 'guru-granth-sahib-live',
    title: 'Sri Guru Granth Sahib Kirtan',
    location: 'Punjab / Global',
    schedule: 'Live Gurbani 24/7',
    category: 'satsang',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'YlnQ2apbtuQ', // Verified Sikh Kirtan
  },
  {
    id: 'iskcon-mayapur',
    title: 'ISKCON Mayapur (HQ)',
    location: 'Mayapur, West Bengal',
    schedule: 'Live Darshan & Kirtan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'West Bengal',
    youtubeVideoId: '2OSiD0YoiGw',
  },
  {
    id: 'iskcon-bangalore',
    title: 'ISKCON Bangalore',
    location: 'Bangalore, Karnataka',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Karnataka',
    youtubeVideoId: 'RZAq3khB0T8',
  },
  {
    id: 'baps-london-neasden',
    title: 'BAPS Neasden Temple',
    location: 'London, UK',
    schedule: 'Global Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Swaminarayan',
    state: 'International',
    youtubeVideoId: 'Nk-guabYF1k',
  },
  {
    id: 'kamakhya-temple-live',
    title: 'Kamakhya Devi Temple',
    location: 'Guwahati, Assam',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shakti',
    state: 'Assam',
    youtubeVideoId: 'djAqGUJEvuc',
  },
  {
    id: 'mahalakshmi-kolhapur',
    title: 'Mahalakshmi Temple',
    location: 'Kolhapur, Maharashtra',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shakti',
    state: 'Maharashtra',
    youtubeVideoId: 'MMWkMx8IOvg',
  },
  {
    id: 'sankat-mochan-hanuman',
    title: 'Sankat Mochan Hanuman',
    location: 'Varanasi, UP',
    schedule: 'Live Aarti & Bhajans',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Hanuman',
    state: 'Uttar Pradesh',
    youtubeVideoId: 'I03T9NCoj_U',
  },
  {
    id: 'takhat-patna-sahib',
    title: 'Takhat Sri Patna Sahib',
    location: 'Patna, Bihar',
    schedule: 'Live Gurbani',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Bihar',
    collections: ['Panj Takht'],
    youtubeVideoId: '2VoKxEz6sSc',
  },
  {
    id: 'jinvani-tv-live',
    title: 'Jinvani TV Live',
    location: 'India',
    schedule: 'Jain Pravachan 24/7',
    category: 'satsang',
    tradition: 'jain',
    state: 'India',
    collections: ['Jain Path'],
    youtubeVideoId: '7Ulm6UNZ578',
  },
  {
    id: 'aadinath-tv-live',
    title: 'Aadinath TV Official',
    location: 'India',
    schedule: 'Jain Bhakti 24/7',
    category: 'satsang',
    tradition: 'jain',
    state: 'India',
    collections: ['Jain Path'],
    youtubeVideoId: 'K1rbZLQ2GbQ',
  },
  {
    id: 'pashupatinath-nepal',
    title: 'Pashupatinath Temple',
    location: 'Kathmandu, Nepal',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shiva',
    state: 'International',
    youtubeVideoId: 'xcDAsM0RUV4',
  },
  {
    id: 'paras-jain-tv',
    title: 'Paras TV (Jain Channel)',
    location: 'India',
    schedule: 'Pravachan & Aarti 24/7',
    category: 'satsang',
    tradition: 'jain',
    state: 'India',
    collections: ['Jain Path'],
    youtubeVideoId: 'cDzIiI0kvNg', // Verified Jain Channel
  },
  {
    id: 'dwarkadhish-temple',
    title: 'Shri Dwarkadhish Mandir',
    location: 'Dwarka, Gujarat',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Gujarat',
    collections: ['Char Dham', 'Saptapuri'],
    youtubeVideoId: 'rWlOF2WGiTA',
  },
  {
    id: 'ayodhya-ram-mandir',
    title: 'Ayodhya Ram Mandir',
    location: 'Ayodhya, UP',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Rama',
    state: 'Uttar Pradesh',
    collections: ['Saptapuri'],
    youtubeVideoId: 'eIPYl54lAJU',
  },
  {
    id: 'ram-katha-live',
    title: 'Ram Katha (Morari Bapu)',
    location: 'Global',
    schedule: 'Live Katha 24/7',
    category: 'katha',
    tradition: 'hindu',
    ishtaDevata: 'Rama',
    collections: ['Katha'],
    youtubeVideoId: 'Yv2D6cWWTq8',
  },
];

/** Returns LIVE_STREAMS with aarti times merged in from AARTI_TIMES lookup. */
export function getLiveStreamsWithAartis(): LiveStream[] {
  return LIVE_STREAMS.map(s => ({
    ...s,
    aartis: AARTI_TIMES[s.id],
  }));
}
