import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  // 1. Auth check same as other crons
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 2. Query all active sankalpas joined with profiles
    const { data: sankalpas, error } = await supabase
      .from('sankalpas')
      .select(`
        id,
        user_id,
        text,
        target_days,
        start_date,
        profiles!inner(
          push_token,
          tradition
        )
      `)
      .eq('status', 'active')
      .not('profiles.push_token', 'is', null);

    if (error) {
      throw error;
    }

    if (!sankalpas || sankalpas.length === 0) {
      return NextResponse.json({ checked: 0, sent: 0 });
    }

    const today = new Date();
    // Normalize today to start of day in UTC for simple date arithmetic
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

    // 4. Filter to sankalpas where daysSinceStart === Math.floor(target_days / 2)
    const halfwaySankalpas = sankalpas.filter((sankalpa) => {
      // 3. Calculate daysSinceStart
      const startDate = new Date(sankalpa.start_date);
      const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
      
      const diffMs = todayUTC - startUTC;
      const daysSinceStart = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return daysSinceStart === Math.floor(sankalpa.target_days / 2);
    });

    if (halfwaySankalpas.length === 0) {
      return NextResponse.json({ checked: sankalpas.length, sent: 0 });
    }

    let sent = 0;

    // 5. Generate message and send push
    const promises = halfwaySankalpas.map(async (sankalpa) => {
      const tradition = (sankalpa.profiles as any)?.tradition ?? 'hindu';
      const pushToken = (sankalpa.profiles as any)?.push_token;
      
      if (!pushToken) return;

      const systemPrompt = `You are Dharma Mitra. Write a 2-sentence mid-journey encouragement for a ${tradition} practitioner who is halfway through their ${sankalpa.target_days}-day sankalpa: '${sankalpa.text}'. Be warm, tradition-specific, use one Sanskrit word. Under 150 chars.`;
      const userPrompt = `Generate mid-point message.`;

      try {
        const result = await generateWithProvider({
          system: systemPrompt,
          user: userPrompt,
          temperature: 0.75,
          maxOutputTokens: 75,
          reasoningEffort: 'none',
        }, { responseFormat: 'text' });

        const message = result.text.trim();

        if (message) {
          // 6. Send push
          await sendOneSignalPush({
            userIds: [sankalpa.user_id],
            title: '⚡ Sankalpa Shakti — Halfway There!',
            body: message,
            url: '/home',
            data: { type: 'sankalpa_checkin', sankalpa_id: sankalpa.id }
          });
          sent++;
        }
      } catch (err) {
        console.error(`Error generating or sending push for sankalpa ${sankalpa.id}`, err);
      }
    });

    // 7. Promise.allSettled
    await Promise.allSettled(promises);

    return NextResponse.json({ checked: sankalpas.length, sent });

  } catch (error) {
    console.error('sankalpa-checkin cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
