import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { getKulPageData } from '@/app/(main)/kul/kul-data';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await getApiUser(request);
  if (!user) return getApiAuthFailureResponse(authError);

  const data = await getKulPageData();
  if (data.userId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(data);
}
