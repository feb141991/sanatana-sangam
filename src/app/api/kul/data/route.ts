import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { getKulPageData } from '@/app/(main)/kul/kul-data';

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getKulPageData();
  if (data.userId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(data);
}
