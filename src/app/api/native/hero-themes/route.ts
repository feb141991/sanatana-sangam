import { NextRequest, NextResponse } from 'next/server';

import { HOME_HERO_THEMES, mapHeroAssetToTheme, type HeroAssetRow, type HomeHeroTheme } from '@/config/festivalThemes';
import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

// Native's "choose a home hero backdrop" picker — the list of options for
// GET /api/native/home-summary's already-resolved `hero.imageUrl` to be
// swapped for. Mirrors the PWA's own `pickerThemes` derivation exactly
// (src/app/(main)/home/sections/HeroSection.tsx), so both platforms offer
// the identical set: admin-uploaded rows from the `hero_assets` table
// (Supabase Storage-backed, so growing this list costs no app release)
// merged with the static bundled defaults in HOME_HERO_THEMES, deduped by
// id (DB rows win), filtered to the caller's tradition.
//
// The user's actual pick is intentionally NOT persisted here — same as
// PWA's `localStorage`-only `shoonaya_hero_pick`, this stays device-local
// (AsyncStorage on native) rather than a new `profiles` column, so it
// costs no additional DB storage per user.
export async function GET(request: NextRequest) {
  const { user, error, supabase } = await getApiUser(request);

  if (error || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tradition = request.nextUrl.searchParams.get('tradition') ?? 'hindu';

  const { data: heroAssetRows } = await supabase
    .from('hero_assets')
    .select('id, label, hero_image, hero_alt, object_position, traditions, sampradayas, ishta_devatas, festival_slugs, priority, is_active')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  const dbThemes = ((heroAssetRows ?? []) as HeroAssetRow[])
    .map(mapHeroAssetToTheme)
    .filter((theme): theme is HomeHeroTheme => theme !== null);

  const seen = new Set<string>();
  const themes = [...dbThemes, ...HOME_HERO_THEMES].filter((theme) => {
    if (seen.has(theme.id)) return false;
    seen.add(theme.id);
    if (!theme.traditions?.length) return true;
    return theme.traditions.includes(tradition);
  });

  return NextResponse.json({ themes });
}
