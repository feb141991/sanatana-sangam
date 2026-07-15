import { NextRequest, NextResponse } from 'next/server';
import { getKathaById } from '@/lib/katha-library';

/**
 * GET /api/bhakti/katha/[id]
 *
 * Public, read-only endpoint — full katha text (all body paragraphs +
 * translations) for the native katha reader screen.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const katha = getKathaById(id);
  if (!katha) {
    return NextResponse.json({ error: 'Katha not found' }, { status: 404 });
  }
  return NextResponse.json(
    { katha },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
