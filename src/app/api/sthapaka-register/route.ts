import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Called by the client-side sthapaka-callback page after it reads the
// access_token from the URL hash (implicit OAuth flow).
// Receives { email, name } and registers/looks up the waitlist entry.

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { email: rawEmail, name: rawName } = await request.json();
    if (!rawEmail) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const email     = rawEmail.toLowerCase().trim();
    const name      = (rawName || '').trim();

    // Check existing
    const { data: existing } = await serviceSupabase
      .from('waitlist')
      .select('id, founding_number')
      .ilike('email', email)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    let foundingNumber: number;

    if (existing) {
      if (existing.founding_number) {
        foundingNumber = existing.founding_number;
      } else {
        const { data: latest } = await serviceSupabase
          .from('waitlist')
          .select('founding_number')
          .not('founding_number', 'is', null)
          .order('founding_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        foundingNumber = ((latest?.founding_number as number | null) ?? 0) + 1;
        await serviceSupabase
          .from('waitlist')
          .update({ founding_number: foundingNumber, name: name || undefined })
          .eq('id', existing.id)
          .is('founding_number', null);
      }
    } else {
      const { data: inserted } = await serviceSupabase
        .from('waitlist')
        .insert({ email, name: name || null, source: 'google_oauth' })
        .select('id, founding_number')
        .single();

      if (inserted?.founding_number) {
        foundingNumber = inserted.founding_number;
      } else {
        const { data: latest } = await serviceSupabase
          .from('waitlist')
          .select('founding_number')
          .not('founding_number', 'is', null)
          .order('founding_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        foundingNumber = ((latest?.founding_number as number | null) ?? 0) + 1;
        if (inserted?.id) {
          await serviceSupabase
            .from('waitlist')
            .update({ founding_number: foundingNumber })
            .eq('id', inserted.id);
        }
      }
    }

    return NextResponse.json({ foundingNumber, name });
  } catch (err) {
    console.error('[sthapaka-register]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
