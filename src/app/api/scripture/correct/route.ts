import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
      scripture_source?: string;
      verse_text_original?: string;
      suggested_correction?: string;
      reason_details?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { scripture_source, verse_text_original, suggested_correction, reason_details } = body;

    if (!scripture_source || !verse_text_original || !suggested_correction) {
      return NextResponse.json(
        { error: 'Missing required fields: scripture_source, verse_text_original, suggested_correction' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('scripture_corrections')
      .insert({
        user_id: user.id,
        scripture_source,
        verse_text_original,
        suggested_correction,
        reason_details: reason_details || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[scripture/correct] Insert failed:', error);
      return NextResponse.json({ error: 'Failed to submit correction' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('[scripture/correct] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
