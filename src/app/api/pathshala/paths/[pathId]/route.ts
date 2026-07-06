import { NextResponse } from 'next/server';
import { SEED_PATHS } from '@/lib/pathshala-paths';
import { getPathLessons } from '@/lib/pathshala-lessons';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pathId: string }> }
) {
  const { pathId } = await params;
  
  const path = SEED_PATHS.find((candidate) => candidate.id === pathId);
  if (!path) {
    return NextResponse.json({ error: 'Path not found' }, { status: 404 });
  }

  const lessons = getPathLessons(pathId);

  return NextResponse.json({ path, lessons });
}
