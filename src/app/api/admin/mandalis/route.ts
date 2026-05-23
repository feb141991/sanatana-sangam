import { checkAdminAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request as any);
  if (authError) return authError;

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('mandalis')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch mandalis' }, { status: 500 });
  }
}
