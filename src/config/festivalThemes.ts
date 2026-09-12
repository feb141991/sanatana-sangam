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
    heroImage: '/assets/images/heroes/sikh/gurpurab.webp',
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
