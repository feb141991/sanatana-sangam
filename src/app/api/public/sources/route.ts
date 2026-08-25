import { NextResponse } from 'next/server';
import { getPublicSourceDisclosures } from '@/lib/public-source-disclosures';

export const revalidate = 86_400;

export async function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    sources: getPublicSourceDisclosures(),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
