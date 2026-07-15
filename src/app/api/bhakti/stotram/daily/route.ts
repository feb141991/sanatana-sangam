import { NextRequest, NextResponse } from 'next/server';
import { STOTRAMS, getStotramsByTradition } from '@/lib/stotrams';

/**
 * GET /api/bhakti/stotram/daily?tradition=hindu
 *
 * Public, read-only endpoint. Picks "today's stotram" by rotating through
 * the tradition's stotram list by day-of-year — identical logic to the
 * PWA's src/app/(main)/bhakti/page.tsx server component, so both platforms
 * show the same daily pick on the same day. Backs the native Bhakti hub's
 * "Today's Stotram" teaser card (Phase 3).
 */
export async function GET(req: NextRequest) {
  const tradition = req.nextUrl.searchParams.get('tradition') ?? 'hindu';

  const traditionStotrams = getStotramsByTradition(tradition);
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const daily = traditionStotrams[dayOfYear % traditionStotrams.length] ?? STOTRAMS[0];

  return NextResponse.json(
    {
      id: daily.id,
      title: daily.title,
      titleDevanagari: daily.titleDevanagari,
      deityEmoji: daily.deityEmoji,
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
