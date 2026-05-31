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
  // New streams
  'guruvayur-krishna':              { morning: '3:00 AM — Nirmalya Darshan', evening: '7:30 PM — Athazha Puja' },
  'meenakshi-amman-madurai':        { morning: '5:30 AM — Thiruvempavai', evening: '9:00 PM — Palliarai Puja' },
  'ramanathaswamy-rameswaram':      { morning: '5:00 AM — Thiruvanandal Puja', evening: '8:00 PM — Artha Jama Puja' },
  'srirangam-ranganathaswamy':      { morning: '6:45 AM — Thiruvanandal', evening: '8:00 PM — Artha Jama Puja' },
  'arunachaleswarar-tiruvannamalai':{ morning: '5:30 AM — Thiruvanandal', evening: '8:30 PM — Artha Jama Puja' },
  'palani-murugan':                 { morning: '6:00 AM — Thiruvanandal', evening: '8:00 PM — Artha Jama Puja' },
  'padmanabhaswamy-trivandrum':     { morning: '3:30 AM — Thiruvananthapuram Seva', evening: '7:30 PM — Aarattu' },
  'kapaleeshwarar-chennai':         { morning: '6:00 AM — Thiruvanandal', evening: '9:00 PM — Artha Jama' },
  'trimbakeshwar-nashik':           { morning: '5:30 AM — Pratah Puja', evening: '7:00 PM — Sandhya Aarti' },
  'baidyanath-deoghar':             { morning: '4:00 AM — Pratah Puja', evening: '6:30 PM — Sandhya Aarti' },
  'grishneshwar-aurangabad':        { morning: '5:30 AM — Pratah Puja', evening: '8:30 PM — Sandhya Aarti' },
  'dakshineswar-kali':              { morning: '6:00 AM — Pratah Aarti', evening: '8:00 PM — Sandhya Aarti' },
  'belur-math-kolkata':             { morning: '5:00 AM — Mangal Aarti', evening: '6:30 PM — Sandhya Aarti' },
  'vaishno-devi-katra':             { morning: '5:00 AM — Pratah Darshan', evening: '8:00 PM — Sandhya Aarti' },
  'har-ki-pauri-haridwar':          { morning: '6:00 AM — Pratah Ganga Aarti', evening: '6:30 PM — Sandhya Ganga Aarti' },
  'pandharpur-vitthal':             { morning: '5:00 AM — Kakad Aarti', evening: '8:30 PM — Shej Aarti' },
  'muktinath-nepal':                { morning: '5:30 AM — Pratah Puja', evening: '6:00 PM — Sandhya Puja' },
  'janakpur-janaki-mandir':         { morning: '5:00 AM — Pratah Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'baps-nj-usa':                    { morning: '6:30 AM — Mangal Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'iskcon-london':                  { morning: '4:30 AM — Mangal Aarti', evening: '7:00 PM — Gaura Aarti' },
  'keshgarh-sahib-anandpur':        { morning: '5:00 AM — Asa Di Var', evening: '8:00 PM — Rehras Sahib' },
  'damdama-sahib-talwandi':         { morning: '5:00 AM — Asa Di Var', evening: '8:00 PM — Sandhya Kirtan' },
  // Jain tirths
  'sammed-shikharji':               { morning: '5:00 AM — Prabhat Vandana', evening: '7:00 PM — Sandhya Aarti' },
  'shravanabelagola-bahubali':      { morning: '6:30 AM — Abhisheka', evening: '7:30 PM — Sandhya Aarti' },
  'shankheshwar-parshwanath':       { morning: '5:30 AM — Mangal Darshan', evening: '7:00 PM — Sandhya Bhakti' },
  'lal-mandir-delhi':               { morning: '5:30 AM — Prabhat Darshan', evening: '7:00 PM — Sandhya Aarti' },
  'pavapuri-jal-mandir':            { morning: '6:00 AM — Mangal Darshan', evening: '7:00 PM — Sandhya Aarti' },
  // Buddhist pilgrimage & monasteries
  'sarnath-dhamek-stupa':           { morning: '6:00 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'lumbini-nepal':                  { morning: '5:30 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'dalai-lama-temple-dharamshala':  { morning: '6:00 AM — Morning Prayer', evening: '5:00 PM — Evening Prayer' },
  'thiksey-monastery-ladakh':       { morning: '6:30 AM — Morning Prayer (Chham)', evening: '6:00 PM — Evening Prayer' },
  'namdroling-bylakuppe':           { morning: '6:00 AM — Morning Chanting', evening: '6:30 PM — Evening Chanting' },

  // ── Additional Hindu temples (India + global) ──────────────────────────────
  'shantikunj-haridwar':            { morning: '5:00 AM — Pratah Sandhya', evening: '6:30 PM — Sandhya Aarti' },
  'shirdi-sai-baba-temple':         { morning: '4:30 AM — Kakad Aarti', evening: '6:30 PM — Dhoop Aarti' },
  'iskcon-hare-krishna':            { morning: '4:30 AM — Mangal Aarti', evening: '7:00 PM — Gaura Aarti' },
  'swaminarayan-kundaldham':        { morning: '6:00 AM — Mangala Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'baps-london-neasden':            { morning: '7:30 AM — Mangala Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'sabarimala-ayyappa':             { morning: '4:30 AM — Nirmalya Darshan', evening: '6:30 PM — Deeparadhana' },
  'murudeshwar-shiva':              { morning: '6:00 AM — Pratah Puja', evening: '7:30 PM — Sandhya Aarti' },
  'nageshvara-jyotirlinga':         { morning: '6:00 AM — Mangal Aarti', evening: '7:00 PM — Sandhya Aarti' },
  'tarakeswar-temple':              { morning: '6:00 AM — Mangal Aarti', evening: '8:00 PM — Sandhya Aarti' },
  'banke-bihari-vrindavan':         { morning: '7:45 AM — Shringar Aarti', evening: '8:30 PM — Shayan Aarti' },
  'triveni-sangam-prayagraj':       { morning: '5:30 AM — Pratah Ganga Aarti', evening: '6:30 PM — Sandhya Ganga Aarti' },
  'brahma-temple-pushkar':          { morning: '6:00 AM — Mangal Aarti', evening: '7:30 PM — Sandhya Aarti' },
  'amarnath-cave-darshan':          { morning: '5:00 AM — Pratah Aarti', evening: '6:00 PM — Sandhya Aarti' },
  'iskcon-delhi':                   { morning: '4:30 AM — Mangal Aarti', evening: '7:00 PM — Gaura Aarti' },
  'akshardham-gandhinagar':         { morning: '7:00 AM — Mangala Aarti', evening: '6:30 PM — Sandhya Aarti' },
  'mathura-yamuna-aarti':           { evening: '7:00 PM — Yamuna Aarti' },
  'vrindavan-yamuna-aarti':         { evening: '7:30 PM — Yamuna Aarti' },
  'kataragama-devalaya':            { morning: '4:30 AM — Morning Pooja', evening: '6:30 PM — Maha Pooja' },
  'svt-pittsburgh-usa':             { morning: '9:00 AM — Suprabhata Seva', evening: '7:00 PM — Sandhya Aarti' },
  'siva-vishnu-temple-dc':          { morning: '9:00 AM — Abhishekam', evening: '7:00 PM — Sandhya Aarti' },
  'meenakshi-temple-houston':       { morning: '9:00 AM — Suprabhata', evening: '7:00 PM — Sandhya Aarti' },
  'murugan-temple-london':          { morning: '8:00 AM — Kalai Pooja', evening: '7:00 PM — Sandhya Pooja' },
  'baps-toronto-canada':            { morning: '7:30 AM — Mangala Aarti', evening: '6:30 PM — Sandhya Aarti' },
  'baps-sydney-australia':          { morning: '7:30 AM — Mangala Aarti', evening: '6:30 PM — Sandhya Aarti' },
  'mariamman-temple-kl':            { morning: '6:30 AM — Morning Pooja', evening: '7:30 PM — Sandhya Pooja' },
  'veeramakali-singapore':          { morning: '6:30 AM — Morning Pooja', evening: '7:30 PM — Sandhya Pooja' },
  'baps-abu-dhabi':                 { morning: '6:30 AM — Mangala Aarti', evening: '8:00 PM — Sandhya Aarti' },
  'grand-bassin-mauritius':         { evening: '6:30 PM — Sandhya Aarti' },
  'shiva-temple-durban':            { morning: '6:00 AM — Morning Pooja', evening: '7:00 PM — Sandhya Aarti' },

  // ── Gurdwaras (Sikh) — Asa Di Var (dawn) & Rehras Sahib (dusk) ─────────────
  'golden-temple-sgpc':             { morning: '4:00 AM — Asa Di Var', evening: '7:00 PM — Rehras Sahib' },
  'takhat-hazur-sahib':             { morning: '4:30 AM — Asa Di Var', evening: '7:30 PM — Rehras Sahib' },
  'takhat-patna-sahib':             { morning: '4:30 AM — Asa Di Var', evening: '7:00 PM — Rehras Sahib' },
  'hazoori-ragi-kirtan':            { morning: '4:00 AM — Asa Di Var Kirtan', evening: '7:00 PM — Rehras Sahib' },
  'guru-granth-sahib-live':         { morning: '4:00 AM — Asa Di Var Kirtan', evening: '7:00 PM — Rehras Sahib' },
  'hemkund-sahib':                  { morning: '5:00 AM — Asa Di Var', evening: '6:00 PM — Rehras Sahib' },

  // ── Jain tirths — Mangal Darshan (dawn) & Sandhya Bhakti (dusk) ────────────
  'palitana-jain-temples':          { morning: '6:30 AM — Mangal Darshan' },
  'ranakpur-jain-temple':           { morning: '7:00 AM — Mangal Darshan', evening: '5:00 PM — Sandhya Bhakti' },
  'dilwara-mount-abu':              { morning: '6:00 AM — Mangal Puja' },
  'shri-mahavirji-rajasthan':       { morning: '5:30 AM — Mangal Darshan', evening: '7:00 PM — Sandhya Aarti' },
  'girnar-jain-temples':            { morning: '7:00 AM — Mangal Darshan' },
  'hastinapur-jain-tirth':          { morning: '6:00 AM — Mangal Darshan', evening: '7:00 PM — Sandhya Aarti' },
  'nakoda-bhairav-tirth':           { morning: '5:30 AM — Mangal Darshan', evening: '7:30 PM — Bhairav Aarti' },
  'kundalpur-jain':                 { morning: '6:00 AM — Mangal Darshan', evening: '7:00 PM — Sandhya Aarti' },
  'sonagiri-jain':                  { morning: '6:30 AM — Mangal Darshan', evening: '7:00 PM — Sandhya Aarti' },
  'mangi-tungi-jain':               { morning: '6:30 AM — Mangal Darshan' },

  // ── Buddhist temples & monasteries — Morning & Evening prayer/chanting ─────
  'boudhanath-stupa':               { morning: '5:30 AM — Morning Kora', evening: '6:30 PM — Butter Lamp Offering' },
  'swayambhunath-nepal':            { morning: '5:00 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'dalada-maligawa-kandy':          { morning: '5:30 AM — Morning Thevava', evening: '6:30 PM — Evening Thevava' },
  'mahabodhi-bodh-gaya':            { morning: '5:00 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'kushinagar-parinirvana':         { morning: '6:00 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'rumtek-monastery-sikkim':        { morning: '6:00 AM — Morning Puja', evening: '5:30 PM — Evening Puja' },
  'tawang-monastery':               { morning: '6:30 AM — Morning Prayer', evening: '5:00 PM — Evening Prayer' },
  'hemis-monastery-ladakh':         { morning: '6:30 AM — Morning Prayer', evening: '5:30 PM — Evening Prayer' },
  'shwedagon-pagoda-yangon':        { morning: '6:00 AM — Morning Chanting', evening: '6:00 PM — Evening Devotion' },
  'wat-arun-bangkok':               { morning: '6:30 AM — Morning Chanting' },
  'big-buddha-hong-kong':           { morning: '6:00 AM — Morning Chanting', evening: '5:00 PM — Evening Prayer' },
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
  }
];

/**
 * Static fallback streams that were manually re-audited against YouTube and
 * are safe to surface when the DB-backed live_darshans table is empty.
 *
 * Important:
 * - "Verified" here means the ID resolves and the stream/video actually matches
 *   the listed shrine/channel with reasonable confidence.
 * - DB-managed streams are intentionally not filtered by this set. Admin data
 *   can move faster and should be validated separately at ingestion time.
 */
export const VERIFIED_STATIC_STREAM_IDS = new Set<string>([
  'krishna-janmabhoomi',
  'mahakaleshwar-ujjain',
  'takhat-hazur-sahib',
  'iskcon-hare-krishna',
  'shantikunj-haridwar',
  'swaminarayan-dhun',
  'sai-baba-dhyan',
  'shiva-mahamrityunjay',
  'brahma-kumaris',
  'tirupati-balaji',
  'siddhivinayak',
  'golden-temple-sgpc',
  'shirdi-sai-baba-temple',
  'puri-jagannath',
  'kedarnath-temple',
  'badrinath-temple',
  'somnath-temple',
  'swaminarayan-kundaldham',
  'hazoori-ragi-kirtan',
  'iskcon-vrindavan',
  'vrindavan-chandrodaya',
  'srisailam-temple',
  'guru-granth-sahib-live',
  'iskcon-bangalore',
  'takhat-patna-sahib',
  'jinvani-tv-live',
  'aadinath-tv-live',
  'pashupatinath-nepal',
  'paras-jain-tv',
  'dwarkadhish-temple',
  'ayodhya-ram-mandir',
  'ram-katha-live',
]);

export type LiveDarshanDbRow = {
  id: string;
  title?: string | null;
  location?: string | null;
  schedule?: string | null;
  category?: LiveStreamCategory | null;
  tradition?: string | null;
  current_video_id?: string | null;
  is_active?: boolean | null;
};

const STATIC_STREAM_BY_ID = new Map(LIVE_STREAMS.map((stream) => [stream.id, stream]));

export function enrichLiveStream(stream: LiveStream): LiveStream {
  return {
    ...stream,
    aartis: AARTI_TIMES[stream.id],
  };
}

/** Returns only the manually re-verified static fallback list. */
export function getLiveStreamsWithAartis(): LiveStream[] {
  return LIVE_STREAMS.filter((s) => VERIFIED_STATIC_STREAM_IDS.has(s.id)).map(enrichLiveStream);
}

/**
 * Resolves the effective stream inventory for product surfaces.
 *
 * Rules:
 * - Prefer active DB-managed streams when available.
 * - Preserve static metadata (collections, ishtaDevata, state) when the IDs match.
 * - Fall back to the verified static set when DB rows are absent.
 */
export function resolveActiveLiveStreams(dbRows?: LiveDarshanDbRow[] | null): LiveStream[] {
  if (!dbRows || dbRows.length === 0) return getLiveStreamsWithAartis();

  const resolved = dbRows
    .filter((row) => row.is_active !== false)
    .map((row) => {
      const fallback = STATIC_STREAM_BY_ID.get(row.id);
      const youtubeVideoId = row.current_video_id || fallback?.youtubeVideoId || '';
      if (!youtubeVideoId) return null;

      return enrichLiveStream({
        id: row.id,
        title: row.title || fallback?.title || row.id,
        location: row.location || fallback?.location || 'Live Darshan',
        schedule: row.schedule || fallback?.schedule || 'Live Darshan',
        category: (row.category || fallback?.category || 'mandir') as LiveStreamCategory,
        tradition: row.tradition || fallback?.tradition || 'hindu',
        youtubeVideoId,
        ishtaDevata: fallback?.ishtaDevata,
        state: fallback?.state,
        collections: fallback?.collections,
        thumbnailUrl: fallback?.thumbnailUrl,
      });
    })
    .filter((stream): stream is LiveStream => Boolean(stream));

  return resolved.length > 0 ? resolved : getLiveStreamsWithAartis();
}
