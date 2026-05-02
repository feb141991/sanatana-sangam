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
    objectPosition: '58% 10%',
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
    objectPosition: '58% 10%',
    traditions: ['hindu'],
    festivalSlugs: ['maha-shiv-aratri', 'maha-shivratri', 'mahashivratri'],
    priority: 100,
  },
  {
    id: 'sikh-default',
    label: 'Sikh default',
    heroImage: '/assets/images/heroes/sikh/default.webp',
    heroAlt: 'Soft devotional Guru Nanak Dev Ji artwork',
    objectPosition: 'center 10%',
    traditions: ['sikh'],
    ishtaDevatas: ['guru-nanak', 'guru_nanak', 'waheguru'],
    priority: 20,
  },
  {
    id: 'guru-nanak-jayanti',
    label: 'Guru Nanak Jayanti',
    heroImage: '/assets/images/heroes/sikh/gurpurab.webp',
    heroAlt: 'Soft Guru Nanak Dev Ji artwork for Gurpurab',
    objectPosition: 'center 10%',
    traditions: ['sikh'],
    festivalSlugs: ['guru-nanak-jayanti', 'gurpurab', 'guru-nanak-gurpurab'],
    priority: 120,
  },
  {
    id: 'buddhist-default',
    label: 'Buddhist default',
    heroImage: '/assets/images/heroes/buddhist/default.webp',
    heroAlt: 'Soft devotional Buddha artwork',
    objectPosition: 'center 10%',
    traditions: ['buddhist'],
    ishtaDevatas: ['buddha', 'shakyamuni-buddha', 'amitabha', 'avalokiteshvara', 'manjushri', 'tara'],
    priority: 20,
  },
  {
    id: 'buddha-purnima',
    label: 'Buddha Purnima',
    heroImage: '/assets/images/heroes/buddhist/vesak.webp',
    heroAlt: 'Soft Buddha artwork for Buddha Purnima',
    objectPosition: 'center 10%',
    traditions: ['buddhist'],
    festivalSlugs: ['buddha-purnima', 'vesak', 'vesak-day'],
    priority: 120,
  },
  {
    id: 'jain-default',
    label: 'Jain default',
    heroImage: '/assets/images/heroes/jain/default.webp',
    heroAlt: 'Soft devotional Bhagwan Mahavir artwork',
    objectPosition: 'center 10%',
    traditions: ['jain'],
    ishtaDevatas: ['mahavir', 'bhagwan-mahavir', 'parshvanath', 'rishabhanatha'],
    priority: 20,
  },
  {
    id: 'mahavir-jayanti',
    label: 'Mahavir Jayanti',
    heroImage: '/assets/images/heroes/jain/mahavir-jayanti.webp',
    heroAlt: 'Soft Bhagwan Mahavir artwork for Mahavir Jayanti',
    objectPosition: 'center 10%',
    traditions: ['jain'],
    festivalSlugs: ['mahavir-jayanti', 'mahaveer-jayanti'],
    priority: 120,
  },
  {
    id: 'global-default',
    label: 'Global default',
    heroImage: '/assets/images/heroes/all/default.webp',
    heroAlt: 'Soft devotional Shiva artwork',
    objectPosition: 'center 10%',
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
