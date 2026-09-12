import type { Festival } from '@/lib/festivals';

export type HomeHeroTheme = {
  id: string;
  label: string;
  heroImage: string;
  heroAlt: string;
  objectPosition: string;
  traditions?: string[];
  sampradayas?: string[];
  ishtaDevatas?: string[];
  festivalSlugs?: string[];
  priority?: number;
};

export type HeroAssetRow = {
  id: string | null;
  label: string;
  hero_image: string;
  hero_alt: string;
  object_position: string;
  traditions?: string[] | null;
  sampradayas?: string[] | null;
  ishta_devatas?: string[] | null;
  festival_slugs?: string[] | null;
  priority?: number | null;
  is_active?: boolean | null;
};

export type ResolveHomeHeroThemeInput = {
  tradition?: string | null;
  sampradaya?: string | null;
  ishtaDevata?: string | null;
  festival?: Pick<Festival, 'name' | 'tradition'> | null;
  selectedHeroId?: string | null;
  lockSelectedHero?: boolean;
  dbThemes?: HomeHeroTheme[];
};

export const HOME_HERO_THEMES: HomeHeroTheme[] = [
  {
    id: 'shaiva-default',
    label: 'Shaiva default',
    heroImage: '/assets/images/heroes/hindu/shiva-default.webp',
    heroAlt: 'Soft devotional Shiva artwork',
    objectPosition: '58% 25%',
    traditions: ['hindu'],
    sampradayas: ['shaiva', 'smarta'],
    ishtaDevatas: ['shiva', 'mahadev', 'bholenath'],
    priority: 10,
  },
  {
    id: 'maha-shivaratri',
    label: 'Maha Shivaratri',
    heroImage: '/assets/images/heroes/hindu/mahashivratri.webp',
    heroAlt: 'Soft Shiva artwork for Maha Shivaratri',
    objectPosition: '58% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['maha-shiv-aratri', 'maha-shivratri', 'mahashivratri'],
    priority: 100,
  },
  {
    id: 'sikh-default',
    label: 'Sikh default',
    heroImage: '/assets/images/heroes/sikh/default.webp',
    heroAlt: 'Soft devotional Guru Nanak Dev Ji artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    ishtaDevatas: ['guru-nanak', 'guru_nanak', 'waheguru'],
    priority: 20,
  },
  {
    id: 'guru-nanak-jayanti',
    label: 'Guru Nanak Jayanti',
    heroImage: '/assets/images/heroes/sikh/sikh-guru-nanak-gurpurab.webp',
    heroAlt: 'Soft Guru Nanak Dev Ji artwork for Gurpurab',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['guru-nanak-jayanti', 'gurpurab', 'guru-nanak-gurpurab'],
    priority: 120,
  },
  {
    id: 'buddhist-default',
    label: 'Buddhist default',
    heroImage: '/assets/images/heroes/buddhist/default.webp',
    heroAlt: 'Soft devotional Buddha artwork',
    objectPosition: 'center 25%',
    traditions: ['buddhist'],
    ishtaDevatas: ['buddha', 'shakyamuni-buddha', 'amitabha', 'avalokiteshvara', 'manjushri', 'tara'],
    priority: 20,
  },
  {
    id: 'buddha-purnima',
    label: 'Buddha Purnima',
    heroImage: '/assets/images/heroes/buddhist/vesak.webp',
    heroAlt: 'Soft Buddha artwork for Buddha Purnima',
    objectPosition: 'center 25%',
    traditions: ['buddhist'],
    festivalSlugs: ['buddha-purnima', 'vesak', 'vesak-day'],
    priority: 120,
  },
  {
    id: 'jain-default',
    label: 'Jain default',
    heroImage: '/assets/images/heroes/jain/default.webp',
    heroAlt: 'Soft devotional Bhagwan Mahavir artwork',
    objectPosition: 'center 25%',
    traditions: ['jain'],
    ishtaDevatas: ['mahavir', 'bhagwan-mahavir', 'parshvanath', 'rishabhanatha'],
    priority: 20,
  },
  {
    id: 'mahavir-jayanti',
    label: 'Mahavir Jayanti',
    heroImage: '/assets/images/heroes/jain/mahavir-jayanti.webp',
    heroAlt: 'Soft Bhagwan Mahavir artwork for Mahavir Jayanti',
    objectPosition: 'center 25%',
    traditions: ['jain'],
    festivalSlugs: ['mahavir-jayanti', 'mahaveer-jayanti'],
    priority: 120,
  },
  {
    id: 'ganesh-chaturthi',
    label: 'Ganesh Chaturthi',
    heroImage: '/assets/images/heroes/hindu/ganesha-divine-dhyana.webp',
    heroAlt: 'Devotional Lord Ganesha artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['ganesh-chaturthi', 'vinayaka-chaturthi', 'ganesha-chaturthi'],
    priority: 120,
  },
  {
    id: 'krishna-janmashtami',
    label: 'Krishna Janmashtami',
    heroImage: '/assets/images/heroes/hindu/krishna-cosmic-flute.webp',
    heroAlt: 'Devotional Sri Krishna flute artwork',
    objectPosition: '65% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['krishna-janmashtami', 'janmashtami', 'gokulashtami', 'sri-krishna-janmashtami'],
    priority: 120,
  },
  {
    id: 'chhath-puja',
    label: 'Chhath Puja',
    heroImage: '/assets/images/heroes/hindu/chhath-surya-arghya.webp',
    heroAlt: 'Devotional Chhath Puja Surya Arghya artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['chhath-puja', 'chhath', 'surya-shashthi'],
    priority: 120,
  },
  {
    id: 'dhanteras',
    label: 'Dhanteras',
    heroImage: '/assets/images/heroes/hindu/dhanteras-deepam-kuber.webp',
    heroAlt: 'Devotional Dhanteras deepam artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['dhanteras', 'dhanatrayodashi', 'dhantrayodashi'],
    priority: 120,
  },
  {
    id: 'naraka-chaturdashi',
    label: 'Naraka Chaturdashi',
    heroImage: '/assets/images/heroes/hindu/naraka-chaturdashi-dawn-deepam.webp',
    heroAlt: 'Devotional Naraka Chaturdashi dawn deepam artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['naraka-chaturdashi', 'choti-diwali', 'roop-chaudas', 'kali-chaudas'],
    priority: 120,
  },
  {
    id: 'diwali',
    label: 'Diwali',
    heroImage: '/assets/images/heroes/hindu/diwali-deepam-serenity.webp',
    heroAlt: 'Devotional Deepavali diya lights artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['diwali', 'deepavali', 'lakshmi-puja', 'deepawali'],
    priority: 130,
  },
  {
    id: 'govardhan-puja',
    label: 'Govardhan Puja',
    heroImage: '/assets/images/heroes/hindu/govardhan-annakut-darshan.webp',
    heroAlt: 'Devotional Govardhan Annakut artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['govardhan-puja', 'annakut', 'govardhan-puja-annakut'],
    priority: 120,
  },
  {
    id: 'bhai-dooj',
    label: 'Bhai Dooj',
    heroImage: '/assets/images/heroes/hindu/bhai-dooj-sacred-aarti.webp',
    heroAlt: 'Devotional Bhai Dooj sacred aarti artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['bhai-dooj', 'yama-dwitiya', 'bhai-phota', 'bhai-tika'],
    priority: 120,
  },
  {
    id: 'holi',
    label: 'Holi',
    heroImage: '/assets/images/heroes/hindu/holi-gulal-vrindavan.webp',
    heroAlt: 'Devotional Holi gulal artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['holi', 'dhulandi', 'holika-dahan', 'rangwali-holi'],
    priority: 120,
  },
  {
    id: 'ram-navami',
    label: 'Rama Navami',
    heroImage: '/assets/images/heroes/hindu/sri-rama-darbar-serene.webp',
    heroAlt: 'Devotional Sri Rama Navami artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['ram-navami', 'rama-navami', 'sri-rama-navami'],
    priority: 120,
  },
  {
    id: 'hanuman-jayanti',
    label: 'Hanuman Jayanti',
    heroImage: '/assets/images/heroes/hindu/hanuman-sita-ram-darshan.webp',
    heroAlt: 'Devotional Sri Hanuman Jayanti artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['hanuman-jayanti', 'sri-hanuman-jayanti', 'hanumath-jayanti'],
    priority: 120,
  },
  {
    id: 'raksha-bandhan',
    label: 'Raksha Bandhan',
    heroImage: '/assets/images/heroes/hindu/bhai-dooj-sacred-aarti.webp',
    heroAlt: 'Devotional Raksha Bandhan artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['raksha-bandhan', 'rakhi'],
    priority: 120,
  },
  {
    id: 'makar-sankranti',
    label: 'Makar Sankranti',
    heroImage: '/assets/images/heroes/hindu/makar-sankranti-uttarayan-dawn.webp',
    heroAlt: 'Devotional Makar Sankranti Uttarayan dawn artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['makar-sankranti', 'uttarayan', 'pongal', 'maghi', 'khichdi'],
    priority: 120,
  },
  {
    id: 'vasant-panchami',
    label: 'Vasant Panchami',
    heroImage: '/assets/images/heroes/hindu/vasant-panchami-saraswati-amber.webp',
    heroAlt: 'Devotional Goddess Saraswati Vasant Panchami artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['vasant-panchami', 'saraswati-puja', 'basant-panchami'],
    priority: 120,
  },
  {
    id: 'gudi-padwa',
    label: 'Gudi Padwa',
    heroImage: '/assets/images/heroes/hindu/gudi-padwa-chaitra-sunrise.webp',
    heroAlt: 'Devotional Gudi Padwa Chaitra Nav Samvatsar artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['gudi-padwa', 'chaitra-shukla-pratipada', 'nav-samvatsar'],
    priority: 120,
  },
  {
    id: 'ugadi',
    label: 'Ugadi',
    heroImage: '/assets/images/heroes/hindu/ugadi-pachadi-mango-dawn.webp',
    heroAlt: 'Devotional Ugadi Deccan New Year artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['ugadi', 'yugadi', 'telugu-new-year', 'kannada-new-year'],
    priority: 120,
  },
  {
    id: 'akshaya-tritiya',
    label: 'Akshaya Tritiya',
    heroImage: '/assets/images/heroes/hindu/akshaya-tritiya-udaka-kumbha.webp',
    heroAlt: 'Devotional Akshaya Tritiya sacred kumbha artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['akshaya-tritiya', 'akha-teej'],
    priority: 120,
  },
  {
    id: 'narasimha-jayanti',
    label: 'Narasimha Jayanti',
    heroImage: '/assets/images/heroes/hindu/narasimha-twilight-protection.webp',
    heroAlt: 'Devotional Lord Narasimha twilight protection artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['narasimha-jayanti', 'sri-narasimha-jayanti'],
    priority: 120,
  },
  {
    id: 'shani-jayanti',
    label: 'Shani Jayanti',
    heroImage: '/assets/images/heroes/hindu/shani-peepal-deepam-dhyana.webp',
    heroAlt: 'Devotional Lord Shani Jayanti peepal deepam artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['shani-jayanti', 'shani-amavasya'],
    priority: 120,
  },
  {
    id: 'jagannath-rath-yatra',
    label: 'Jagannath Rath Yatra',
    heroImage: '/assets/images/heroes/hindu/jagannath-puri-rath-yatra.webp',
    heroAlt: 'Devotional Puri Jagannath Rath Yatra chariot artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['jagannath-rath-yatra', 'puri-rath-yatra', 'rath-yatra'],
    priority: 120,
  },
  {
    id: 'nag-panchami',
    label: 'Nag Panchami',
    heroImage: '/assets/images/heroes/hindu/nag-panchami-shesha-dhyana.webp',
    heroAlt: 'Devotional Nag Panchami sacred serpent artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['nag-panchami', 'naga-panchami'],
    priority: 120,
  },
  {
    id: 'hartalika-teej',
    label: 'Hartalika Teej',
    heroImage: '/assets/images/heroes/hindu/hartalika-teej-forest-tapasya.webp',
    heroAlt: 'Devotional Hartalika Teej Shiva-Parvati tapasya artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['hartalika-teej', 'teej', 'hartalika-vrat'],
    priority: 120,
  },
  {
    id: 'karva-chauth',
    label: 'Karva Chauth',
    heroImage: '/assets/images/heroes/hindu/karva-chauth-moonrise-serenity.webp',
    heroAlt: 'Devotional Karva Chauth moonrise serenity artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['karva-chauth', 'karwa-chauth', 'karak-chaturthi'],
    priority: 120,
  },
  {
    id: 'gita-jayanti',
    label: 'Gita Jayanti',
    heroImage: '/assets/images/heroes/hindu/gita-jayanti-kurukshetra-darshan.webp',
    heroAlt: 'Devotional Gita Jayanti Krishna-Arjuna darshan artwork',
    objectPosition: '50% 25%',
    traditions: ['hindu'],
    festivalSlugs: ['gita-jayanti', 'geeta-jayanti', 'mokshada-ekadashi'],
    priority: 120,
  },
  {
    id: 'baisakhi',
    label: 'Vaisakhi (Khalsa Saajna Divas)',
    heroImage: '/assets/images/heroes/sikh/sikh-baisakhi-khalsa-saajna.webp',
    heroAlt: 'Devotional Vaisakhi Khalsa Saajna Divas Khanda artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['baisakhi', 'vaisakhi', 'khalsa-saajna-divas', 'khalsa-panth-foundation'],
    priority: 120,
  },
  {
    id: 'guru-gobind-singh-jayanti',
    label: 'Guru Gobind Singh Ji Gurpurab',
    heroImage: '/assets/images/heroes/sikh/sikh-guru-gobind-singh-ji.webp',
    heroAlt: 'Devotional Sri Guru Gobind Singh Ji artwork',
    objectPosition: 'center 20%',
    traditions: ['sikh'],
    festivalSlugs: ['guru-gobind-singh-gurpurab', 'guru-gobind-singh-jayanti', 'guru-gobind-singh-prakash-parv'],
    priority: 120,
  },
  {
    id: 'bandhi-chhor-divas',
    label: 'Bandi Chhor Divas',
    heroImage: '/assets/images/heroes/sikh/sikh-bandhi-chhor-divas.webp',
    heroAlt: 'Devotional Bandi Chhor Divas illuminated Harmandir Sahib artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['bandhi-chhor-divas', 'bandi-chhor-divas', 'bandi-chhor-diwas'],
    priority: 120,
  },
  {
    id: 'holla-mohalla',
    label: 'Hola Mohalla',
    heroImage: '/assets/images/heroes/sikh/sikh-hola-mohalla.webp',
    heroAlt: 'Devotional Hola Mohalla martial celebration artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['holla-mohalla', 'hola-mohalla'],
    priority: 120,
  },
  {
    id: 'lohri',
    label: 'Lohri',
    heroImage: '/assets/images/heroes/sikh/sikh-lohri-bonfire.webp',
    heroAlt: 'Devotional Lohri winter harvest bonfire artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['lohri', 'lohri-harvest'],
    priority: 120,
  },
  {
    id: 'guru-arjan-dev-martyrdom',
    label: 'Guru Arjan Dev Ji Shaheedi Diwas',
    heroImage: '/assets/images/heroes/sikh/sikh-guru-arjan-dev-shaheedi.webp',
    heroAlt: 'Devotional Sri Guru Arjan Dev Ji Shaheedi Diwas serene artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['guru-arjan-dev-martyrdom', 'shaheedi-guru-arjan-dev', 'guru-arjan-dev-shaheedi'],
    priority: 120,
  },
  {
    id: 'guru-tegh-bahadur-martyrdom',
    label: 'Guru Tegh Bahadur Ji Shaheedi Diwas',
    heroImage: '/assets/images/heroes/sikh/sikh-guru-tegh-bahadur-shaheedi.webp',
    heroAlt: 'Devotional Sri Guru Tegh Bahadur Ji Shaheedi Diwas serene artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['guru-tegh-bahadur-martyrdom', 'shaheedi-guru-tegh-bahadur', 'guru-tegh-bahadur-shaheedi'],
    priority: 120,
  },
  {
    id: 'sahibzade-shaheedi-diwas',
    label: 'Chaar Sahibzade Shaheedi Diwas',
    heroImage: '/assets/images/heroes/sikh/sikh-chaar-sahibzade-shaheedi.webp',
    heroAlt: 'Devotional Chaar Sahibzade Shaheedi Diwas Veer Baal Diwas artwork',
    objectPosition: 'center 20%',
    traditions: ['sikh'],
    festivalSlugs: ['sahibzade-shaheedi-diwas', 'chaar-sahibzade-shaheedi', 'veer-baal-diwas', 'veer-bal-diwas'],
    priority: 120,
  },
  {
    id: 'guru-ravidas-jayanti',
    label: 'Bhagat Ravidas Jayanti',
    heroImage: '/assets/images/heroes/sikh/sikh-guru-ravidas-jayanti.webp',
    heroAlt: 'Devotional Bhagat Ravidas Ji Jayanti serene artwork',
    objectPosition: 'center 25%',
    traditions: ['sikh'],
    festivalSlugs: ['guru-ravidas-jayanti', 'bhagat-ravidas-jayanti', 'sant-ravidas-jayanti'],
    priority: 120,
  },
  {
    id: 'global-default',
    label: 'Global default',
    heroImage: '/assets/images/heroes/all/default.webp',
    heroAlt: 'Soft devotional Shiva artwork',
    objectPosition: 'center 25%',
    priority: 0,

  },
];

export function mapHeroAssetToTheme(asset: HeroAssetRow): HomeHeroTheme | null {
  if (asset.is_active === false || !asset.hero_image) return null;

  return {
    id: asset.id ?? asset.label,
    label: asset.label,
    heroImage: asset.hero_image,
    heroAlt: asset.hero_alt,
    objectPosition: asset.object_position || 'center 24%',
    traditions: asset.traditions ?? undefined,
    sampradayas: asset.sampradayas ?? undefined,
    ishtaDevatas: asset.ishta_devatas ?? undefined,
    festivalSlugs: asset.festival_slugs ?? undefined,
    priority: (asset.priority ?? 0) + 1000,
  };
}

export function slugifyFestivalName(name?: string | null) {
  return (name ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalise(value?: string | null) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '-');
}

function matches(list: string[] | undefined, value?: string | null) {
  if (!list?.length || !value) return false;
  const normalised = normalise(value);
  return list.some(item => normalise(item) === normalised);
}

export function resolveHomeHeroTheme(input: ResolveHomeHeroThemeInput): HomeHeroTheme {
  const allThemes = [
    ...(input.dbThemes ?? []),
    ...HOME_HERO_THEMES,
  ];
  const selected = input.selectedHeroId
    ? allThemes.find(theme => theme.id === input.selectedHeroId)
    : undefined;

  if (selected && input.lockSelectedHero) return selected;

  const festivalSlug = slugifyFestivalName(input.festival?.name);
  const festivalMatch = allThemes
    .filter(theme => matches(theme.festivalSlugs, festivalSlug))
    .filter(theme => !theme.traditions?.length || matches(theme.traditions, input.tradition) || matches(theme.traditions, input.festival?.tradition))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  if (festivalMatch) return festivalMatch;
  if (selected) return selected;

  const ishtaMatch = allThemes
    .filter(theme => matches(theme.ishtaDevatas, input.ishtaDevata))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  if (ishtaMatch) return ishtaMatch;

  const sampradayaMatch = allThemes
    .filter(theme => matches(theme.sampradayas, input.sampradaya))
    .filter(theme => !theme.traditions?.length || matches(theme.traditions, input.tradition))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  if (sampradayaMatch) return sampradayaMatch;

  const traditionMatch = allThemes
    .filter(theme => matches(theme.traditions, input.tradition))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  return traditionMatch ?? allThemes.find(theme => theme.id === 'global-default') ?? HOME_HERO_THEMES[0];
}
