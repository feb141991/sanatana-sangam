import { NextResponse } from 'next/server';
import { SEED_PATHS } from '@/lib/pathshala-paths';

export async function GET() {
  return NextResponse.json({ paths: SEED_PATHS });
}
