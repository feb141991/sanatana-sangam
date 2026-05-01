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

export type ResolveHomeHeroThemeInput = {
  tradition?: string | null;
  sampradaya?: string | null;
  ishtaDevata?: string | null;
  festival?: Pick<Festival, 'name' | 'tradition'> | null;
  selectedHeroId?: string | null;
  lockSelectedHero?: boolean;
};

export const HOME_HERO_THEMES: HomeHeroTheme[] = [
  {
    id: 'shaiva-default',
    label: 'Shaiva default',
    heroImage: '/images/heroes/shiv-default.webp',
    heroAlt: 'Soft devotional Shiva artwork',
    objectPosition: '58% 24%',
    traditions: ['hindu'],
    sampradayas: ['shaiva', 'smarta'],
    ishtaDevatas: ['shiva', 'mahadev', 'bholenath'],
    priority: 10,
  },
  {
    id: 'maha-shivaratri',
    label: 'Maha Shivaratri',
    heroImage: '/images/heroes/shiv-default.webp',
    heroAlt: 'Soft Shiva artwork for Maha Shivaratri',
    objectPosition: '58% 22%',
    traditions: ['hindu'],
    festivalSlugs: ['maha-shivaratri', 'maha-shivratri', 'mahashivratri'],
    priority: 100,
  },
  {
    id: 'global-default',
    label: 'Global default',
    heroImage: '/images/heroes/shiv-default.webp',
    heroAlt: 'Soft devotional Shiva artwork',
    objectPosition: 'center 24%',
    priority: 0,
  },
];

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
  const selected = input.selectedHeroId
    ? HOME_HERO_THEMES.find(theme => theme.id === input.selectedHeroId)
    : undefined;

  if (selected && input.lockSelectedHero) return selected;

  const festivalSlug = slugifyFestivalName(input.festival?.name);
  const festivalMatch = HOME_HERO_THEMES
    .filter(theme => matches(theme.festivalSlugs, festivalSlug))
    .filter(theme => !theme.traditions?.length || matches(theme.traditions, input.tradition) || matches(theme.traditions, input.festival?.tradition))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  if (festivalMatch) return festivalMatch;
  if (selected) return selected;

  const ishtaMatch = HOME_HERO_THEMES
    .filter(theme => matches(theme.ishtaDevatas, input.ishtaDevata))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  if (ishtaMatch) return ishtaMatch;

  const sampradayaMatch = HOME_HERO_THEMES
    .filter(theme => matches(theme.sampradayas, input.sampradaya))
    .filter(theme => !theme.traditions?.length || matches(theme.traditions, input.tradition))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  if (sampradayaMatch) return sampradayaMatch;

  const traditionMatch = HOME_HERO_THEMES
    .filter(theme => matches(theme.traditions, input.tradition))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  return traditionMatch ?? HOME_HERO_THEMES.find(theme => theme.id === 'global-default') ?? HOME_HERO_THEMES[0];
}
