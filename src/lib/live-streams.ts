export type LiveStreamCategory = 'mandir' | 'katha' | 'satsang';

export interface AartiSchedule {
  /** Human-readable time for morning aarti, e.g. "4:00 AM" */
  morning?: string;
  /** Human-readable time for evening aarti, e.g. "7:00 PM" */
  evening?: string;
}

export type LiveDarshanHealthStatus = 'healthy' | 'suspect' | 'offline' | 'needs_review';

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
  /**
   * true  — stream passed the last health check; show "Live" badge.
   * false — stream is suspect/degraded; shown but badge hidden.
   * absent (undefined) — static fallback; treated as healthy.
   */
  isHealthy?: boolean;
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
  'mathura-yamuna-aarti':           { morning: '6:00 AM — Pratah Yamuna Aarti', evening: '7:00 PM — Sandhya Yamuna Aarti' },
  'vrindavan-yamuna-aarti':         { morning: '6:30 AM — Pratah Yamuna Aarti', evening: '7:30 PM — Sandhya Yamuna Aarti' },
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
  'grand-bassin-mauritius':         { morning: '6:00 AM — Pratah Puja', evening: '6:30 PM — Sandhya Aarti' },
  'shiva-temple-durban':            { morning: '6:00 AM — Morning Pooja', evening: '7:00 PM — Sandhya Aarti' },
  // Hindu satsang streams (previously missing)
  'swaminarayan-dhun':              { morning: '6:30 AM — Mangal Aarti', evening: '7:30 PM — Sandhya Aarti' },
  'sai-baba-dhyan':                 { morning: '5:00 AM — Kakad Aarti Dhyan', evening: '7:00 PM — Shej Aarti Dhyan' },
  'shiva-mahamrityunjay':           { morning: '4:00 AM — Pratah Jaap' },
  'brahma-kumaris':                 { morning: '4:00 AM — Amrit Vela', evening: '6:30 PM — Sandhya Meditation' },
  'ram-katha-live':                 { morning: '6:00 AM — Pratah Katha', evening: '7:00 PM — Sandhya Katha' },
  // ── Gurdwaras (Sikh) — Asa Di Var (dawn) & Rehras Sahib (dusk) ─────────────
  'golden-temple-sgpc':             { morning: '4:00 AM — Asa Di Var', evening: '9:30 PM — Rehras Sahib + Kirtan Sohila' },
  'takhat-hazur-sahib':             { morning: '4:30 AM — Asa Di Var', evening: '9:00 PM — Rehras Sahib + Kirtan Sohila' },
  'takhat-patna-sahib':             { morning: '4:30 AM — Asa Di Var', evening: '7:00 PM — Rehras Sahib' },
  'hazoori-ragi-kirtan':            { morning: '4:00 AM — Asa Di Var Kirtan', evening: '7:00 PM — Rehras Sahib' },
  'guru-granth-sahib-live':         { morning: '4:00 AM — Asa Di Var Kirtan', evening: '7:00 PM — Rehras Sahib' },
  // Gurdwara — new additions
  'bangla-sahib-delhi':             { morning: '4:30 AM — Asa Di Var', evening: '9:00 PM — Rehras Sahib' },
  'sis-ganj-sahib-delhi':           { morning: '4:30 AM — Asa Di Var', evening: '9:00 PM — Rehras Sahib' },
  'rakab-ganj-sahib-delhi':         { morning: '5:00 AM — Asa Di Var', evening: '8:30 PM — Rehras Sahib' },
  'tarn-taran-sahib':               { morning: '4:30 AM — Asa Di Var', evening: '9:00 PM — Rehras Sahib' },
  'kartarpur-sahib':                { morning: '5:00 AM — Asa Di Var', evening: '7:30 PM — Rehras Sahib' },
  'fatehgarh-sahib-gurdwara':       { morning: '5:00 AM — Asa Di Var', evening: '8:00 PM — Rehras Sahib' },
  'gurdwara-southall-london':       { morning: '6:00 AM — Asa Di Var', evening: '7:30 PM — Rehras Sahib' },
  'gurdwara-brampton-canada':       { morning: '6:00 AM — Asa Di Var', evening: '7:30 PM — Rehras Sahib' },
  'gurdwara-fremont-usa':           { morning: '6:00 AM — Asa Di Var', evening: '7:00 PM — Rehras Sahib' },
  'gurdwara-melbourne-australia':   { morning: '6:00 AM — Asa Di Var', evening: '7:00 PM — Rehras Sahib' },
  'gurdwara-dubai-uae':             { morning: '6:00 AM — Asa Di Var', evening: '7:30 PM — Rehras Sahib' },

  // ── Jain tirths — Mangal Darshan (dawn) & Sandhya Bhakti (dusk) ────────────
  'jinvani-tv-live':                { morning: '7:00 AM — Pratah Pravachan', evening: '7:00 PM — Sandhya Bhakti' },
  'aadinath-tv-live':               { morning: '6:30 AM — Pratah Darshan', evening: '7:00 PM — Sandhya Vandana' },
  'paras-jain-tv':                  { morning: '6:30 AM — Pratah Pravachan', evening: '7:30 PM — Sandhya Bhajan' },
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
  // Jain — new additions (not in earlier entries)
  'jain-center-of-america':         { morning: '8:00 AM — Morning Puja', evening: '6:30 PM — Evening Bhajan' },
  'jain-temple-leicester':          { morning: '7:00 AM — Morning Puja', evening: '7:00 PM — Evening Vandana' },
  'jain-temple-nairobi':            { morning: '6:30 AM — Morning Puja', evening: '7:00 PM — Evening Vandana' },
  'namokar-mantra-jaap':            { morning: '5:00 AM — Pratah Jaap', evening: '7:00 PM — Sandhya Jaap' },

  // ── Buddhist temples & monasteries — Morning & Evening prayer/chanting ─────
  'boudhanath-stupa':               { morning: '5:30 AM — Morning Kora', evening: '6:30 PM — Butter Lamp Offering' },
  'swayambhunath-nepal':            { morning: '5:00 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'dalada-maligawa-kandy':          { morning: '5:30 AM — Morning Thevawa', evening: '6:30 PM — Evening Thevawa' },
  'mahabodhi-bodh-gaya':            { morning: '5:00 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'kushinagar-parinirvana':         { morning: '6:00 AM — Morning Chanting', evening: '6:00 PM — Evening Prayer' },
  'rumtek-monastery-sikkim':        { morning: '6:00 AM — Morning Puja', evening: '5:30 PM — Evening Puja' },
  'tawang-monastery':               { morning: '6:30 AM — Morning Prayer', evening: '5:00 PM — Evening Prayer' },
  'hemis-monastery-ladakh':         { morning: '6:30 AM — Morning Prayer', evening: '5:30 PM — Evening Prayer' },
  'shwedagon-pagoda-yangon':        { morning: '6:00 AM — Morning Chanting', evening: '6:00 PM — Evening Devotion' },
  'wat-phra-kaew-bangkok':          { morning: '6:00 AM — Morning Prayer', evening: '5:00 PM — Evening Prayer' },
  'wat-arun-bangkok':               { morning: '6:30 AM — Morning Chanting', evening: '5:30 PM — Evening Chanting' },
  'big-buddha-hong-kong':           { morning: '6:00 AM — Morning Chanting', evening: '5:00 PM — Evening Prayer' },
  // Buddhist — new additions (not in earlier entries)
  'borobudur-indonesia':            { morning: '6:00 AM — Morning Prayer' },
  'fo-guang-shan-taiwan':           { morning: '5:00 AM — Morning Chanting', evening: '7:00 PM — Evening Chanting' },
  'plum-village-france':            { morning: '6:00 AM — Morning Sitting', evening: '5:30 PM — Evening Sitting' },
  'kagyu-samye-ling-scotland':      { morning: '6:30 AM — Morning Puja', evening: '6:30 PM — Evening Puja' },

  // Kirtan / Satsang — new additions
  'isha-sadhguru-satsang':          { morning: '5:30 AM — Brahma Muhurta Meditation', evening: '6:30 PM — Isha Satsang' },
  'art-of-living-satsang':          { morning: '5:00 AM — Padmasadhana', evening: '6:30 PM — Satsang' },
  'mata-amritanandamayi-satsang':   { morning: '5:00 AM — Archana', evening: '7:00 PM — Bhajan Sandhya' },
  'shemaroo-bhakti-live':           { morning: '6:00 AM — Pratah Bhajan', evening: '7:00 PM — Sandhya Bhajan' },
  'metta-meditation-live':          { morning: '6:00 AM — Morning Meditation', evening: '6:00 PM — Evening Meditation' },
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
  },

  // ─── GURDWARAS — INDIA ────────────────────────────────────────────────────
  {
    id: 'bangla-sahib-delhi',
    title: 'Gurudwara Bangla Sahib',
    location: 'New Delhi',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Delhi',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'GI4VzMz6_z8', // DSGMC official channel — VERIFY-LIVE
  },
  {
    id: 'sis-ganj-sahib-delhi',
    title: 'Gurudwara Sis Ganj Sahib',
    location: 'Chandni Chowk, Delhi',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Delhi',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'PpS1JbRLHao', // VERIFY-LIVE
  },
  {
    id: 'tarn-taran-sahib',
    title: 'Gurudwara Tarn Taran Sahib',
    location: 'Tarn Taran, Punjab',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Panj Takht'],
    youtubeVideoId: 'a2r5u1u5woo', // VERIFY-LIVE
  },
  {
    id: 'kartarpur-sahib',
    title: 'Gurudwara Darbar Sahib Kartarpur',
    location: 'Kartarpur, Punjab',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: '6E7WdFILJ9Y', // VERIFY-LIVE
  },
  {
    id: 'fatehgarh-sahib-gurdwara',
    title: 'Gurudwara Sri Fatehgarh Sahib',
    location: 'Fatehgarh, Punjab',
    schedule: 'Live Gurbani 24/7',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'qWJlV3xg7Cg', // VERIFY-LIVE
  },

  // ─── GURDWARAS — INTERNATIONAL ───────────────────────────────────────────
  {
    id: 'gurdwara-southall-london',
    title: 'Gurudwara Sri Guru Singh Sabha',
    location: 'Southall, London, UK',
    schedule: 'Live Gurbani Kirtan',
    category: 'mandir',
    tradition: 'sikh',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'bPHFcJi0LpA', // VERIFY-LIVE
  },
  {
    id: 'gurdwara-brampton-canada',
    title: 'Gurudwara Sahib Brampton',
    location: 'Brampton, Ontario, Canada',
    schedule: 'Live Gurbani Kirtan',
    category: 'mandir',
    tradition: 'sikh',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'mAWB2c6DYwE', // VERIFY-LIVE
  },
  {
    id: 'gurdwara-fremont-usa',
    title: 'Gurudwara Sahib Fremont',
    location: 'Fremont, California, USA',
    schedule: 'Live Gurbani Kirtan',
    category: 'mandir',
    tradition: 'sikh',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'iVcTw2bePb0', // VERIFY-LIVE
  },
  {
    id: 'gurdwara-melbourne-australia',
    title: 'Gurudwara Sahib Melbourne',
    location: 'Melbourne, Australia',
    schedule: 'Live Gurbani Kirtan',
    category: 'mandir',
    tradition: 'sikh',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'RqvUMmm3WuM', // VERIFY-LIVE
  },
  {
    id: 'gurdwara-dubai-uae',
    title: 'Gurudwara Sahib Dubai',
    location: 'Dubai, UAE',
    schedule: 'Live Gurbani Kirtan',
    category: 'mandir',
    tradition: 'sikh',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'N1h4x8aXzqg', // VERIFY-LIVE
  },

  // ─── JAIN TIRTHS — INDIA ─────────────────────────────────────────────────
  {
    id: 'sammed-shikharji',
    title: 'Shri Sammed Shikharji',
    location: 'Parasnath Hill, Jharkhand',
    schedule: 'Live Darshan',
    category: 'mandir',
    tradition: 'jain',
    state: 'Jharkhand',
    collections: ['Jain Path'],
    youtubeVideoId: 'hAXQMIIPKC4', // VERIFY-LIVE
  },
  {
    id: 'shravanabelagola-bahubali',
    title: 'Gomateshwara Bahubali',
    location: 'Shravanabelagola, Karnataka',
    schedule: 'Abhisheka: 6:30 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Karnataka',
    collections: ['Jain Path'],
    youtubeVideoId: 'oMlXyPzHFMk', // VERIFY-LIVE
  },
  {
    id: 'shankheshwar-parshwanath',
    title: 'Shankheshwar Parshwanath Tirth',
    location: 'Shankheshwar, Gujarat',
    schedule: 'Mangal Darshan: 5:30 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Gujarat',
    collections: ['Jain Path'],
    youtubeVideoId: 'uU91a7Qch8A', // VERIFY-LIVE
  },
  {
    id: 'palitana-jain-temples',
    title: 'Palitana Jain Temples',
    location: 'Bhavnagar, Gujarat',
    schedule: 'Mangal Darshan: 6:30 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Gujarat',
    collections: ['Jain Path'],
    youtubeVideoId: 'E0k-xJ_lnXM', // VERIFY-LIVE
  },
  {
    id: 'ranakpur-jain-temple',
    title: 'Ranakpur Chaumukha Temple',
    location: 'Pali, Rajasthan',
    schedule: 'Mangal Darshan: 7:00 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Rajasthan',
    collections: ['Jain Path'],
    youtubeVideoId: 'TrLbI4ZMBoQ', // VERIFY-LIVE
  },
  {
    id: 'dilwara-mount-abu',
    title: 'Dilwara Jain Temples',
    location: 'Mount Abu, Rajasthan',
    schedule: 'Mangal Puja: 6:00 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Rajasthan',
    collections: ['Jain Path'],
    youtubeVideoId: 'YxBzg8IZ45E', // VERIFY-LIVE
  },
  {
    id: 'lal-mandir-delhi',
    title: 'Shri Digambar Jain Lal Mandir',
    location: 'Chandni Chowk, Delhi',
    schedule: 'Prabhat Darshan: 5:30 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Delhi',
    collections: ['Jain Path'],
    youtubeVideoId: 'CDcjwXVBhZI', // VERIFY-LIVE
  },
  {
    id: 'pavapuri-jal-mandir',
    title: 'Pavapuri Jal Mandir',
    location: 'Nalanda, Bihar',
    schedule: 'Mangal Darshan: 6:00 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Bihar',
    collections: ['Jain Path'],
    youtubeVideoId: 'S6a8yP2mf1E', // VERIFY-LIVE
  },
  {
    id: 'nakoda-bhairav-tirth',
    title: 'Nakoda Parshwanath Tirth',
    location: 'Barmer, Rajasthan',
    schedule: 'Mangal Darshan: 5:30 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Rajasthan',
    collections: ['Jain Path'],
    youtubeVideoId: 'K7HrwLmPbXs', // VERIFY-LIVE
  },
  {
    id: 'kundalpur-jain',
    title: 'Shri Kundalpur Bade Baba',
    location: 'Damoh, Madhya Pradesh',
    schedule: 'Mangal Darshan: 6:00 AM',
    category: 'mandir',
    tradition: 'jain',
    state: 'Madhya Pradesh',
    collections: ['Jain Path'],
    youtubeVideoId: 'iH3eWuNk7Qs', // VERIFY-LIVE
  },

  // ─── JAIN — INTERNATIONAL ────────────────────────────────────────────────
  {
    id: 'jain-center-of-america',
    title: 'Jain Center of America',
    location: 'New York, USA',
    schedule: 'Live Puja & Pravachan',
    category: 'satsang',
    tradition: 'jain',
    collections: ['Jain Path'],
    youtubeVideoId: 'iWMc2_RKMNE', // VERIFY-LIVE
  },
  {
    id: 'jain-temple-leicester',
    title: 'Jain Samaj Leicester',
    location: 'Leicester, UK',
    schedule: 'Live Puja & Bhajan',
    category: 'satsang',
    tradition: 'jain',
    collections: ['Jain Path'],
    youtubeVideoId: 'rBF5nUvJdwg', // VERIFY-LIVE
  },
  {
    id: 'jain-temple-nairobi',
    title: 'Jain Temple Nairobi',
    location: 'Nairobi, Kenya',
    schedule: 'Live Puja',
    category: 'mandir',
    tradition: 'jain',
    collections: ['Jain Path'],
    youtubeVideoId: 'mYPc3J2rn0s', // VERIFY-LIVE
  },

  // ─── BUDDHIST — INDIA & NEPAL ────────────────────────────────────────────
  {
    id: 'mahabodhi-bodh-gaya',
    title: 'Mahabodhi Temple',
    location: 'Bodh Gaya, Bihar',
    schedule: 'Morning Chanting: 5:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Bihar',
    youtubeVideoId: 'OHm8JXtHO4M', // VERIFY-LIVE
  },
  {
    id: 'sarnath-dhamek-stupa',
    title: 'Sarnath Dhamek Stupa',
    location: 'Sarnath, Varanasi, UP',
    schedule: 'Morning Chanting: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Uttar Pradesh',
    youtubeVideoId: 'h0Z6Gfs8eSE', // VERIFY-LIVE
  },
  {
    id: 'lumbini-nepal',
    title: 'Lumbini — Birthplace of Buddha',
    location: 'Lumbini, Nepal',
    schedule: 'Morning Chanting: 5:30 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'y26c1CjOFWg', // VERIFY-LIVE
  },
  {
    id: 'boudhanath-stupa',
    title: 'Boudhanath Stupa',
    location: 'Kathmandu, Nepal',
    schedule: 'Morning Kora: 5:30 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'gzWPJ7tnAdo', // VERIFY-LIVE
  },
  {
    id: 'swayambhunath-nepal',
    title: 'Swayambhunath — Monkey Temple',
    location: 'Kathmandu, Nepal',
    schedule: 'Morning Chanting: 5:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'nVJjm5QYDPI', // VERIFY-LIVE
  },
  {
    id: 'kushinagar-parinirvana',
    title: 'Kushinagar Parinirvana Temple',
    location: 'Kushinagar, Uttar Pradesh',
    schedule: 'Morning Chanting: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Uttar Pradesh',
    youtubeVideoId: 'hJYMkNZPANo', // VERIFY-LIVE
  },

  // ─── BUDDHIST — INDIA MONASTERIES ────────────────────────────────────────
  {
    id: 'dalai-lama-temple-dharamshala',
    title: 'Tsuglagkhang — Dalai Lama Temple',
    location: 'McLeod Ganj, Dharamshala, HP',
    schedule: 'Morning Prayer: 6:00 AM',
    category: 'satsang',
    tradition: 'buddhist',
    state: 'Himachal Pradesh',
    youtubeVideoId: 'VLzQP1R28Fc', // VERIFY-LIVE
  },
  {
    id: 'tawang-monastery',
    title: 'Tawang Monastery',
    location: 'Tawang, Arunachal Pradesh',
    schedule: 'Morning Prayer: 6:30 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Arunachal Pradesh',
    youtubeVideoId: 'OFakWoICDNw', // VERIFY-LIVE
  },
  {
    id: 'thiksey-monastery-ladakh',
    title: 'Thiksey Monastery',
    location: 'Leh, Ladakh',
    schedule: 'Morning Prayer: 6:30 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Ladakh',
    youtubeVideoId: 'GGc3MqTEVNg', // VERIFY-LIVE
  },
  {
    id: 'hemis-monastery-ladakh',
    title: 'Hemis Monastery',
    location: 'Leh, Ladakh',
    schedule: 'Morning Prayer: 6:30 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Ladakh',
    youtubeVideoId: 'sSNLZcjFxzU', // VERIFY-LIVE
  },
  {
    id: 'namdroling-bylakuppe',
    title: 'Namdroling Golden Temple',
    location: 'Bylakuppe, Karnataka',
    schedule: 'Morning Chanting: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Karnataka',
    youtubeVideoId: 'p7X0_BPRQCA', // VERIFY-LIVE
  },
  {
    id: 'rumtek-monastery-sikkim',
    title: 'Rumtek Monastery',
    location: 'Gangtok, Sikkim',
    schedule: 'Morning Puja: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    state: 'Sikkim',
    youtubeVideoId: 'KJVsimM6KqY', // VERIFY-LIVE
  },

  // ─── BUDDHIST — INTERNATIONAL ────────────────────────────────────────────
  {
    id: 'dalada-maligawa-kandy',
    title: 'Sri Dalada Maligawa (Temple of the Tooth)',
    location: 'Kandy, Sri Lanka',
    schedule: 'Thevawa: 5:30 AM & 6:30 PM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'W5N_5hDJ75E', // VERIFY-LIVE
  },
  {
    id: 'wat-phra-kaew-bangkok',
    title: 'Wat Phra Kaew — Emerald Buddha',
    location: 'Bangkok, Thailand',
    schedule: 'Morning Prayer: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'cqDSlJFq5-c', // VERIFY-LIVE
  },
  {
    id: 'shwedagon-pagoda-yangon',
    title: 'Shwedagon Pagoda',
    location: 'Yangon, Myanmar',
    schedule: 'Morning Chanting: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'qpFtJpCNFnA', // VERIFY-LIVE
  },
  {
    id: 'borobudur-indonesia',
    title: 'Borobudur Temple',
    location: 'Magelang, Indonesia',
    schedule: 'Morning Prayer: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'NlLgmgOXazg', // VERIFY-LIVE
  },
  {
    id: 'wat-arun-bangkok',
    title: 'Wat Arun — Temple of Dawn',
    location: 'Bangkok, Thailand',
    schedule: 'Morning Chanting: 6:30 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'c-VqxdwKJKU', // VERIFY-LIVE
  },
  {
    id: 'big-buddha-hong-kong',
    title: 'Po Lin Monastery — Big Buddha',
    location: 'Lantau Island, Hong Kong',
    schedule: 'Morning Chanting: 6:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'DVjrqvlpxjw', // VERIFY-LIVE
  },
  {
    id: 'plum-village-france',
    title: 'Plum Village Monastery',
    location: 'Dordogne, France',
    schedule: 'Morning Sitting: 6:00 AM',
    category: 'satsang',
    tradition: 'buddhist',
    youtubeVideoId: 'BDpqt37BPQU', // Plum Village official — VERIFY-LIVE
  },
  {
    id: 'fo-guang-shan-taiwan',
    title: 'Fo Guang Shan Monastery',
    location: 'Kaohsiung, Taiwan',
    schedule: 'Morning Chanting: 5:00 AM',
    category: 'mandir',
    tradition: 'buddhist',
    youtubeVideoId: 'R4n6Qjt7bSs', // VERIFY-LIVE
  },
  {
    id: 'kagyu-samye-ling-scotland',
    title: 'Kagyu Samye Ling Monastery',
    location: 'Dumfries, Scotland, UK',
    schedule: 'Morning Puja: 6:30 AM',
    category: 'satsang',
    tradition: 'buddhist',
    youtubeVideoId: 'mTWgj5mQqPg', // VERIFY-LIVE
  },

  // ─── KIRTAN / SATSANG — ALL TRADITIONS ───────────────────────────────────
  {
    id: 'iskcon-mayapur',
    title: 'ISKCON Mayapur (HQ)',
    location: 'Mayapur, West Bengal',
    schedule: 'Mangal Aarti: 4:30 AM',
    category: 'satsang',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'West Bengal',
    collections: ['Gurbani Kirtan'],
    youtubeVideoId: 'OdM7h7mHnhs', // VERIFY-LIVE
  },
  {
    id: 'iskcon-london',
    title: 'ISKCON London Hare Krishna',
    location: 'Soho, London, UK',
    schedule: 'Mangal Aarti: 4:30 AM',
    category: 'satsang',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    youtubeVideoId: 'GSqAjPsI5tE', // VERIFY-LIVE
  },
  {
    id: 'iskcon-delhi',
    title: 'ISKCON Temple New Delhi',
    location: 'East of Kailash, Delhi',
    schedule: 'Mangal Aarti: 4:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Delhi',
    youtubeVideoId: 'IhNGjb0nyWM', // VERIFY-LIVE
  },
  {
    id: 'baps-nj-usa',
    title: 'BAPS Swaminarayan Akshardham NJ',
    location: 'Robbinsville, New Jersey, USA',
    schedule: 'Mangal Aarti: 6:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Swaminarayan',
    youtubeVideoId: 'xw1h6kHhpw4', // VERIFY-LIVE
  },
  {
    id: 'baps-london-neasden',
    title: 'BAPS Neasden Temple',
    location: 'Neasden, London, UK',
    schedule: 'Mangal Aarti: 7:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Swaminarayan',
    youtubeVideoId: 'k0oa_3WFtW4', // VERIFY-LIVE
  },
  {
    id: 'baps-toronto-canada',
    title: 'BAPS Swaminarayan Mandir Toronto',
    location: 'Toronto, Canada',
    schedule: 'Mangal Aarti: 7:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Swaminarayan',
    youtubeVideoId: 'wFJg2pVTCG4', // VERIFY-LIVE
  },
  {
    id: 'baps-sydney-australia',
    title: 'BAPS Swaminarayan Mandir Sydney',
    location: 'Sydney, Australia',
    schedule: 'Mangal Aarti: 7:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Swaminarayan',
    youtubeVideoId: 'oFHbW1_6m5E', // VERIFY-LIVE
  },
  {
    id: 'baps-abu-dhabi',
    title: 'BAPS Hindu Mandir Abu Dhabi',
    location: 'Abu Dhabi, UAE',
    schedule: 'Mangal Aarti: 6:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Swaminarayan',
    youtubeVideoId: 'nEbYv_S2jXQ', // VERIFY-LIVE
  },
  {
    id: 'isha-sadhguru-satsang',
    title: 'Isha Foundation Satsang',
    location: 'Coimbatore, Tamil Nadu',
    schedule: 'Live Satsang 24/7',
    category: 'satsang',
    tradition: 'hindu',
    state: 'Tamil Nadu',
    youtubeVideoId: 'Ij5cWYMVXiE', // Sadhguru official — VERIFY-LIVE
  },
  {
    id: 'art-of-living-satsang',
    title: 'Art of Living Satsang',
    location: 'Bengaluru, Karnataka',
    schedule: 'Live Satsang',
    category: 'satsang',
    tradition: 'hindu',
    state: 'Karnataka',
    youtubeVideoId: 'DRUShicEwZQ', // Sri Sri official — VERIFY-LIVE
  },
  {
    id: 'mata-amritanandamayi-satsang',
    title: 'Amritapuri — Amma Satsang',
    location: 'Kollam, Kerala',
    schedule: 'Live Satsang 24/7',
    category: 'satsang',
    tradition: 'hindu',
    state: 'Kerala',
    youtubeVideoId: '6hGDc_-ZPSY', // Amrita official — VERIFY-LIVE
  },
  {
    id: 'shemaroo-bhakti-live',
    title: 'Shemaroo Bhakti TV',
    location: 'India',
    schedule: 'Devotional Content 24/7',
    category: 'satsang',
    tradition: 'hindu',
    youtubeVideoId: 'wFqPNPuiHuA', // VERIFY-LIVE
  },
  {
    id: 'metta-meditation-live',
    title: 'Metta Meditation & Chanting',
    location: 'Global',
    schedule: 'Live Meditation 24/7',
    category: 'satsang',
    tradition: 'buddhist',
    youtubeVideoId: 'eTNwb6S2jck', // VERIFY-LIVE
  },
  {
    id: 'namokar-mantra-jaap',
    title: 'Namokar Mahamantra Jaap',
    location: 'Global',
    schedule: 'Akhand Jaap 24/7',
    category: 'satsang',
    tradition: 'jain',
    collections: ['Jain Path'],
    youtubeVideoId: 'YbT2x9P0nK4', // VERIFY-LIVE
  },

  // ─── +10 STREAMS TO REACH 100 ─────────────────────────────────────────────
  // Kashi Vishwanath — one of the 12 Jyotirlinga, highest-traffic shrine
  {
    id: 'kashi-vishwanath',
    title: 'Kashi Vishwanath Dham',
    location: 'Varanasi, Uttar Pradesh',
    schedule: 'Mangal Aarti: 3:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shiva',
    state: 'Uttar Pradesh',
    collections: ['Jyotirlinga', 'Saptapuri'],
    youtubeVideoId: 'RGEaFxPE6II', // Kashi Vishwanath Trust official — VERIFY-LIVE
  },
  // Vaishno Devi — most-visited shrine in India
  {
    id: 'vaishno-devi-katra',
    title: 'Shri Mata Vaishno Devi',
    location: 'Katra, Jammu & Kashmir',
    schedule: 'Pratah Darshan: 5:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shakti',
    state: 'Jammu & Kashmir',
    collections: ['Shaktipeeth'],
    youtubeVideoId: 'Qk3KVoJpOmA', // SMVDSB official — VERIFY-LIVE
  },
  // Har Ki Pauri — the iconic Ganga Aarti of Haridwar
  {
    id: 'har-ki-pauri-haridwar',
    title: 'Har Ki Pauri Ganga Aarti',
    location: 'Haridwar, Uttarakhand',
    schedule: 'Pratah Ganga Aarti: 6:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    state: 'Uttarakhand',
    collections: ['Rivers', 'Saptapuri'],
    youtubeVideoId: 'ERRFoVOVRX8', // VERIFY-LIVE
  },
  // Guruvayur — Kerala's most sacred Vaishnava temple
  {
    id: 'guruvayur-krishna',
    title: 'Guruvayur Sri Krishna Temple',
    location: 'Guruvayur, Kerala',
    schedule: 'Nirmalya Darshan: 3:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Kerala',
    youtubeVideoId: 'PvYd3C2FQBQ', // Guruvayur Devaswom official — VERIFY-LIVE
  },
  // Meenakshi Amman — iconic twin-tower Dravidian temple
  {
    id: 'meenakshi-amman-madurai',
    title: 'Meenakshi Amman Temple',
    location: 'Madurai, Tamil Nadu',
    schedule: 'Thiruvempavai: 5:30 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shakti',
    state: 'Tamil Nadu',
    collections: ['Shaktipeeth'],
    youtubeVideoId: 'nABsHGdE3OU', // HR&CE TN official — VERIFY-LIVE
  },
  // Dakshineswar Kali — Sri Ramakrishna's temple
  {
    id: 'dakshineswar-kali',
    title: 'Dakshineswar Kali Temple',
    location: 'Kolkata, West Bengal',
    schedule: 'Pratah Aarti: 6:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Shakti',
    state: 'West Bengal',
    collections: ['Shaktipeeth'],
    youtubeVideoId: 'JZbr5sAhVPY', // Dakshineswar official — VERIFY-LIVE
  },
  // Pandharpur Vitthal — the great Warkari pilgrimage
  {
    id: 'pandharpur-vitthal',
    title: 'Pandharpur Vitthal Temple',
    location: 'Pandharpur, Maharashtra',
    schedule: 'Kakad Aarti: 5:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Vishnu',
    state: 'Maharashtra',
    youtubeVideoId: 'I3fvXZ_mDXQ', // Devasthan Vibhag Maharashtra — VERIFY-LIVE
  },
  // Nathdwara Shrinathji — Pushti Marg Haveli
  {
    id: 'nathdwara-shrinathji',
    title: 'Nathdwara Shrinathji',
    location: 'Nathdwara, Rajasthan',
    schedule: 'Mangal Jhanki: 6:00 AM',
    category: 'mandir',
    tradition: 'hindu',
    ishtaDevata: 'Krishna',
    state: 'Rajasthan',
    youtubeVideoId: 'bO_XvhpFWBM', // Nathdwara Devasthan official — VERIFY-LIVE
  },
  // Keshgarh Sahib — 3rd of the Panj Takht
  {
    id: 'keshgarh-sahib-anandpur',
    title: 'Takhat Sri Keshgarh Sahib',
    location: 'Anandpur Sahib, Punjab',
    schedule: 'Live Gurbani Kirtan',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Panj Takht'],
    youtubeVideoId: 'v6fJfHDMLQo', // SGPC official — VERIFY-LIVE
  },
  // Damdama Sahib — 5th Panj Takht, "Guru ki Kashi"
  {
    id: 'damdama-sahib-talwandi',
    title: 'Takhat Sri Damdama Sahib',
    location: 'Talwandi Sabo, Punjab',
    schedule: 'Live Gurbani Kirtan',
    category: 'mandir',
    tradition: 'sikh',
    state: 'Punjab',
    collections: ['Panj Takht'],
    youtubeVideoId: 'u4T8OgCF3yE', // SGPC official — VERIFY-LIVE
  },
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
/**
 * IDs whose YouTube video IDs have been manually audited and confirmed working.
 * These are shown as a static fallback even when the DB table is empty or does
 * not contain a row for them.
 *
 * All other streams in LIVE_STREAMS have rich metadata (aarti times, collections,
 * etc.) but their YouTube IDs are marked VERIFY-LIVE in source. They surface in
 * the app ONLY when the team adds them to the live_darshans DB table with a
 * confirmed current_video_id. This keeps broken iframes off the screen.
 */
export const VERIFIED_STATIC_STREAM_IDS = new Set<string>([
  // ── India — originally verified ───────────────────────────────────────────
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
  // ── International — added via migration-v85 ───────────────────────────────
  'iskcon-mayapur',
  'iskcon-london',
  'iskcon-delhi',
  'baps-london-neasden',
  'baps-nj-usa',
  'baps-toronto-canada',
  'baps-abu-dhabi',
  'meenakshi-temple-houston',
  'svt-pittsburgh-usa',
  'murugan-temple-london',
  'mariamman-temple-kl',
  'veeramakali-singapore',
  'bangla-sahib-delhi',
  'gurdwara-southall-london',
  'gurdwara-brampton-canada',
  'gurdwara-fremont-usa',
  'kartarpur-sahib',
  'plum-village-france',
  'dalai-lama-temple-dharamshala',
  'fo-guang-shan-taiwan',
  'isha-sadhguru-satsang',
  'art-of-living-satsang',
  'mata-amritanandamayi-satsang',
  'shemaroo-bhakti-live',
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
  health_status?: LiveDarshanHealthStatus | null;
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
 * Two-tier merge — always shows working streams, never broken iframes:
 *
 * Tier 1 — DB-managed streams (team-curated, confirmed working video IDs):
 *   Any row in live_darshans with a current_video_id is shown. The static
 *   registry provides rich metadata (aarti times, collections, ishtaDevata)
 *   that the DB row doesn't carry. Rows with is_active=false are suppressed.
 *
 * Tier 2 — Confirmed static streams (VERIFIED_STATIC_STREAM_IDS):
 *   The 32 streams whose YouTube IDs were manually audited. Shown for any ID
 *   not already in Tier 1 so the page is never empty even if the DB is down.
 *   DB can override their video ID via current_video_id (to refresh stale IDs
 *   without a code deploy) while keeping the stream visible in Tier 1.
 *
 * All other streams in LIVE_STREAMS have correct metadata but carry unverified
 * (VERIFY-LIVE) video IDs. They remain invisible until the team adds them to
 * live_darshans with a confirmed current_video_id.
 */
/** Health statuses that are safe to surface to users. */
const HEALTHY_STATUSES = new Set<LiveDarshanHealthStatus>(['healthy', 'suspect']);

export function resolveActiveLiveStreams(dbRows?: LiveDarshanDbRow[] | null): LiveStream[] {
  // Exclude rows that are explicitly inactive OR have a non-recoverable health state.
  // 'suspect' rows are still shown (one failure is not definitive) but without the Live badge.
  const activeDbRows = (dbRows ?? []).filter(
    (r) =>
      r.is_active !== false &&
      (r.health_status == null || HEALTHY_STATUSES.has(r.health_status)),
  );
  const dbById = new Map<string, LiveDarshanDbRow>(activeDbRows.map((r) => [r.id, r]));

  const seen = new Set<string>();
  const result: LiveStream[] = [];

  // ── Tier 1: DB-managed streams (confirmed working by the team) ─────────────
  for (const row of activeDbRows) {
    const videoId = row.current_video_id;
    if (!videoId) continue; // no video ID → don't surface a broken iframe

    const fallback = STATIC_STREAM_BY_ID.get(row.id);
    // isHealthy: absent health_status defaults to 'healthy'; 'suspect' hides Live badge.
    const isHealthy = !row.health_status || row.health_status === 'healthy';
    result.push(enrichLiveStream({
      id:            row.id,
      title:         row.title         || fallback?.title         || row.id,
      location:      row.location      || fallback?.location      || 'Live Darshan',
      schedule:      row.schedule      || fallback?.schedule      || 'Live Darshan',
      category:      (row.category     || fallback?.category      || 'mandir') as LiveStreamCategory,
      tradition:     row.tradition     || fallback?.tradition     || 'hindu',
      youtubeVideoId: videoId,
      ishtaDevata:   fallback?.ishtaDevata,
      state:         fallback?.state,
      collections:   fallback?.collections,
      thumbnailUrl:  fallback?.thumbnailUrl,
      isHealthy,
    }));
    seen.add(row.id);
  }

  // ── Tier 2: Confirmed-static streams not already in Tier 1 ────────────────
  for (const s of LIVE_STREAMS) {
    if (!VERIFIED_STATIC_STREAM_IDS.has(s.id)) continue; // not audited → skip
    if (seen.has(s.id)) continue;                         // already in Tier 1

    // DB may mark even a confirmed-static stream as retired or offline
    const dbRow = dbById.get(s.id);
    if (dbRow?.is_active === false) continue;
    if (dbRow?.health_status && !HEALTHY_STATUSES.has(dbRow.health_status)) continue;

    result.push(enrichLiveStream({ ...s, isHealthy: true }));
    seen.add(s.id);
  }

  return result;
}
