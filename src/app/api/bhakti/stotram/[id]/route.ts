import { NextRequest, NextResponse } from 'next/server';
import { getStotramById } from '@/lib/stotrams';

/**
 * GET /api/bhakti/stotram/[id]
 *
 * Public, read-only endpoint — full stotram (all verses, Sanskrit/
 * transliteration/meaning, audio track id) for the native stotram detail
 * screen (Phase 3).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stotram = getStotramById(id);
  if (!stotram) {
    return NextResponse.json({ error: 'Stotram not found' }, { status: 404 });
  }
  return NextResponse.json(
    { stotram },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
