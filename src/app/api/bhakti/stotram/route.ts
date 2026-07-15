import { NextRequest, NextResponse } from 'next/server';
import { STOTRAMS, DEITY_META, MOOD_META, type Stotram } from '@/lib/stotrams';

/**
 * GET /api/bhakti/stotram?tradition=hindu&deity=ganesha&mood=morning&type=stotram&limit=30
 *
 * Public, read-only endpoint — no auth required. Backs both the native
 * "Stotrams & Hymns" / "Sacred Chants" Bhakti cards (Phase 5, filtered by
 * tradition) and mirrors the PWA's browse/page.tsx filter set (deity/mood/
 * type), so native can build the same "Sacred Library" browse screen.
 *
 * Returns a lightweight list (no `verses` — use GET
 * /api/bhakti/stotram/[id] for full lyrics) to keep the list payload small.
 */
function toListItem(s: Stotram) {
  return {
    id: s.id,
    title: s.title,
    titleDevanagari: s.titleDevanagari,
    deity: s.deity,
    deityEmoji: s.deityEmoji,
    tradition: s.tradition,
    type: s.type,
    mood: s.mood,
    language: s.language,
    source: s.source,
    description: s.description,
    hasAudio: Boolean(s.audioTrackId),
    verseCount: s.verses.length,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tradition = searchParams.get('tradition');
  const deity = searchParams.get('deity');
  const mood = searchParams.get('mood');
  const type = searchParams.get('type');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(200, Number(limitParam) || 30)) : undefined;

  let stotrams = STOTRAMS.filter((s) => {
    const traditionOk = !tradition || tradition === 'all' || s.tradition === tradition || s.tradition === 'all';
    const deityOk = !deity || deity === 'all' || s.deity === deity || s.deity === 'universal';
    const moodOk = !mood || mood === 'all' || s.mood === mood;
    const typeOk = !type || type === 'all' || s.type === type;
    return traditionOk && deityOk && moodOk && typeOk;
  });

  if (limit) stotrams = stotrams.slice(0, limit);

  return NextResponse.json(
    { stotrams: stotrams.map(toListItem), total: stotrams.length, deityMeta: DEITY_META, moodMeta: MOOD_META },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
