import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { thread_id, reaction_type } = body;

    if (!thread_id || !reaction_type) {
      return NextResponse.json({ error: 'thread_id and reaction_type are required' }, { status: 400 });
    }

    if (!['pranam', 'bhakti', 'prakas'].includes(reaction_type)) {
      return NextResponse.json({ error: 'Invalid reaction_type' }, { status: 400 });
    }

    // Check if reaction already exists
    const { data: existing, error: checkError } = await supabase
      .from('thread_reactions')
      .select('id')
      .eq('thread_id', thread_id)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Toggle off: Delete reaction
      const { error: deleteError } = await supabase
        .from('thread_reactions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;

      return NextResponse.json({ action: 'removed' });
    } else {
      // Insert reaction
      const { error: insertError } = await supabase
        .from('thread_reactions')
        .insert({
          thread_id,
          user_id: user.id,
          reaction_type,
        });

      if (insertError) throw insertError;

      return NextResponse.json({ action: 'added' });
    }
  } catch (err) {
    console.error('[vichaar/react/POST] Failed:', err);
    return NextResponse.json({ error: 'Failed to process reaction' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const threadIdsParam = searchParams.get('thread_ids');

    if (!threadIdsParam) {
      return NextResponse.json({ reactions: [] });
    }

    const threadIds = threadIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (threadIds.length === 0) {
      return NextResponse.json({ reactions: [] });
    }

    const { data: rows, error } = await supabase
      .from('thread_reactions')
      .select('thread_id, reaction_type')
      .eq('user_id', user.id)
      .in('thread_id', threadIds);

    if (error) throw error;

    return NextResponse.json({
      reactions:
        rows?.map((r) => ({
          thread_id: r.thread_id,
          reaction_type: r.reaction_type,
        })) || [],
    });
  } catch (err) {
    console.error('[vichaar/react/GET] Failed:', err);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}
