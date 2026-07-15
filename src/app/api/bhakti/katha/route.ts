import { NextRequest, NextResponse } from 'next/server';
import { ALL_KATHAS, getKathasByTradition, type Katha, type KathaTradition } from '@/lib/katha-library';

/**
 * GET /api/bhakti/katha?tradition=hindu&view=puranic&limit=20
 *
 * Public, read-only endpoint — no auth required. Backs the native Bhakti
 * "Puranic Tales / Bani & Sakhis / Dhamma Stories / Jain Kathas /
 * Panchatantra / Heroes of Bharat" cards, mirroring the PWA's
 * src/app/(main)/bhakti/katha/KathaClient.tsx VIEW_CONFIGS filters exactly
 * so both platforms show the same list for the same `view`.
 *
 * Returns a lightweight list (no `body`/`bodyHi`/`bodyPa` paragraphs — use
 * GET /api/bhakti/katha/[id] for the full reader text) to keep the list
 * payload small.
 */

type ViewKey = 'puranic' | 'bani' | 'dhamma' | 'jain' | 'panchatantra' | 'heroes';

const VIEW_FILTERS: Record<ViewKey, (k: Katha) => boolean> = {
  puranic: (k) => (k.tradition === 'hindu' || k.tradition === 'all') && !k.tags.includes('panchatantra') && !k.tags.includes('heroes'),
  bani: (k) => k.tradition === 'sikh' || k.tradition === 'all',
  dhamma: (k) => k.tradition === 'buddhist' || k.tradition === 'all',
  jain: (k) => k.tradition === 'jain' || k.tradition === 'all',
  panchatantra: (k) => k.tags.includes('panchatantra'),
  heroes: (k) =>
    k.tags.some((t) => ['warriors', 'saints', 'heroes', 'martyrdom', 'seva', 'sacrifice'].includes(t)) &&
    !k.tags.includes('panchatantra'),
};

function isViewKey(value: string | null): value is ViewKey {
  return !!value && value in VIEW_FILTERS;
}

function toListItem(k: Katha) {
  return {
    id: k.id,
    tradition: k.tradition,
    occasion: k.occasion,
    deity: k.deity,
    title: k.title,
    titleHi: k.titleHi,
    titlePa: k.titlePa,
    preview: k.preview,
    previewHi: k.previewHi,
    previewPa: k.previewPa,
    phal: k.phal,
    durationMin: k.durationMin,
    tags: k.tags,
    portrait: k.portrait,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tradition = searchParams.get('tradition');
  const view = searchParams.get('view');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam) || 20)) : undefined;

  let kathas: Katha[];
  if (isViewKey(view)) {
    kathas = ALL_KATHAS.filter(VIEW_FILTERS[view]);
  } else if (tradition) {
    kathas = getKathasByTradition(tradition as KathaTradition);
  } else {
    kathas = ALL_KATHAS;
  }

  if (limit) kathas = kathas.slice(0, limit);

  return NextResponse.json(
    { kathas: kathas.map(toListItem), total: kathas.length },
    { headers: { 'Cache-Control': 'public, max-age=3600' } } // content is static — 1hr cache
  );
}
