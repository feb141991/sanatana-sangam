import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: sankalpa, error } = await supabase
      .from('sankalpas')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_date', todayStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw error;
    }

    return NextResponse.json({ sankalpa: sankalpa || null });
  } catch (err) {
    console.error('[sankalpa/GET] Failed:', err);
    return NextResponse.json({ error: 'Failed to fetch sankalpa' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, related_practice, target_days } = body;

    // Validation
    if (!text || typeof text !== 'string' || text.length < 10 || text.length > 200) {
      return NextResponse.json({ error: 'Text must be between 10 and 200 characters' }, { status: 400 });
    }
    const days = Number(target_days);
    if (![11, 21, 40, 108].includes(days)) {
      return NextResponse.json({ error: 'target_days must be one of 11, 21, 40, 108' }, { status: 400 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Mark existing active sankalpas as abandoned
    await supabase
      .from('sankalpas')
      .update({ status: 'abandoned', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Create new
    const { data: sankalpa, error } = await supabase
      .from('sankalpas')
      .insert({
        user_id: user.id,
        text,
        related_practice: related_practice || null,
        target_days: days,
        start_date: todayStr,
        end_date: endDateStr,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ sankalpa });
  } catch (err) {
    console.error('[sankalpa/POST] Failed:', err);
    return NextResponse.json({ error: 'Failed to create sankalpa' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !['completed', 'abandoned'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sankalpas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id); // Security: must belong to user

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[sankalpa/PATCH] Failed:', err);
    return NextResponse.json({ error: 'Failed to update sankalpa' }, { status: 500 });
  }
}
