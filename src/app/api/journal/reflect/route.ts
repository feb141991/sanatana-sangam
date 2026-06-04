import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Pro gate: AI reflection is a Zenith feature ───────────────────────
    const { data: gateProfile } = await supabase
      .from('profiles')
      .select('is_pro, subscription_status')
      .eq('id', user.id)
      .single();

    const isPro = gateProfile?.is_pro === true ||
      gateProfile?.subscription_status === 'pro' ||
      gateProfile?.subscription_status === 'kul_pro';

    if (!isPro) {
      return NextResponse.json({
        error: 'upgrade_required',
        message: 'AI reflections are a Zenith feature. Upgrade to unlock weekly, monthly and quarterly spiritual reflections.',
        upgrade_url: '/settings/subscription',
      }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as {
      period?: 'weekly' | 'monthly' | 'quarterly';
    } | null;

    const period = body?.period || 'weekly';
    if (!['weekly', 'monthly', 'quarterly'].includes(period)) {
      return NextResponse.json({ error: 'Invalid reflection period' }, { status: 400 });
    }

    // Determine how many entries to look back
    let limitCount = 7;
    if (period === 'monthly') limitCount = 30;
    if (period === 'quarterly') limitCount = 90;

    // First try fetching unreflected entries
    let { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('id, entry_date, content, mood, tradition_context, tags')
      .eq('user_id', user.id)
      .eq('ai_reflection_generated', false)
      .order('entry_date', { ascending: true })
      .limit(limitCount);

    if (entriesError) {
      console.error('[POST /api/journal/reflect] Error fetching unreflected entries:', entriesError);
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    // Fallback: If no unreflected entries exist, fetch the latest entries anyway so user can regenerate
    if (!entries || entries.length === 0) {
      const { data: latestEntries, error: fallbackError } = await supabase
        .from('journal_entries')
        .select('id, entry_date, content, mood, tradition_context, tags')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: true })
        .limit(limitCount);

      if (fallbackError) {
        console.error('[POST /api/journal/reflect] Error fetching fallback entries:', fallbackError);
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      entries = latestEntries || [];
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        error: 'No journal entries found. Write at least one entry before generating a reflection.'
      }, { status: 400 });
    }

    // Fetch user profile metadata to contextualize reflection (reuse pro check profile where possible)
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition, sampradaya, seeking, spiritual_level')
      .eq('id', user.id)
      .single();

    const tradition = profile?.tradition || null;
    const sampradaya = profile?.sampradaya || null;
    const seeking = profile?.seeking || [];
    const spiritualLevel = profile?.spiritual_level || null;

    // Construct entries content for Claude
    const formattedEntries = entries.map((entry, idx) => {
      const context = entry.tradition_context ? ` [Practice: ${entry.tradition_context}]` : '';
      const tagsStr = entry.tags && entry.tags.length > 0 ? ` (Tags: ${entry.tags.join(', ')})` : '';
      return `[Entry ${idx + 1} - Date: ${entry.entry_date} - Mood: ${entry.mood}${context}${tagsStr}]\nContent:\n${entry.content}\n`;
    }).join('\n---\n\n');

    // Build the system prompt
    const systemPrompt = [
      'You are a wise, warm spiritual guide and mentor inside the Shoonaya app.',
      'Your task is to generate a periodic spiritual reflection for a user based on their journal entries from the recent period.',
      'Your tone must be compassionate, insightful, grounding, and spiritually mature — not a therapist, not a life coach.',
      '',
      `Primary user tradition: ${tradition || 'General Dharmic/Universal'}.`,
      `Sampradaya/Path: ${sampradaya || 'not specified'}.`,
      `User seeking focus: ${seeking.length > 0 ? seeking.join(', ') : 'general spiritual growth'}.`,
      `Spiritual level: ${spiritualLevel || 'seeker'}.`,
      '',
      'Analyze the user\'s journal entries chronologically. You must:',
      '1. Identify recurring themes in their thoughts, sadhana (practices), and daily life.',
      '2. Note and highlight areas of spiritual growth, mindfulness, or deepening devotion.',
      '3. Acknowledge any struggles, doubts, or difficulties they face with deep compassion and without judgment.',
      '4. Connect their experiences and reflections to their chosen tradition (e.g. Sanatan Dharma/Hindu, Sikh, Buddhist, Jain).',
      '5. End with a tradition-specific scripture or sacred quote (e.g. Bhagavad Gita, Guru Granth Sahib, Dhammapada, Tattvartha Sutra, etc. depending on their tradition) that resonates with their current journey and the periodic reflection.',
      '',
      'You must structure your response using XML tags:',
      '- Place the final reflection text inside <reflection>...</reflection> tags. Do not mention any clinical or therapeutic jargon. Speak as a wise spiritual companion.',
      '- Place a JSON string array of 3-5 short key theme tags inside <themes>...</themes> tags (e.g., <themes>["Mindfulness", "Surrender", "Patience"]</themes>).',
      '',
      'Format the output precisely so it can be parsed.'
    ].join('\n');

    const userMessage = `Here are my journal entries for the past period (${period}):\n\n${formattedEntries}\n\nPlease generate my reflection.`;

    const aiResult = await generateWithProvider(
      { system: systemPrompt, user: userMessage, maxOutputTokens: 1500 },
      { responseFormat: 'text' }
    );
    const responseText = aiResult.text ?? '';

    // Parse the output using regex
    const reflectionMatch = responseText.match(/<reflection>([\s\S]*?)<\/reflection>/);
    const themesMatch = responseText.match(/<themes>([\s\S]*?)<\/themes>/);

    let reflectionText = reflectionMatch ? reflectionMatch[1].trim() : '';
    let themes: string[] = [];

    if (themesMatch) {
      try {
        themes = JSON.parse(themesMatch[1].trim());
      } catch {
        // fallback parsing if JSON.parse fails
        themes = themesMatch[1]
          .replace(/[\[\]"]/g, '')
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean);
      }
    }

    // Fallback if tags were completely missed or malformed
    if (!reflectionText) {
      reflectionText = responseText.replace(/<themes>[\s\S]*?<\/themes>/g, '').trim();
    }
    if (themes.length === 0) {
      themes = ['Reflection', period];
    }

    const entryIds = entries.map(e => e.id);

    // Save reflection to DB
    const { data: reflection, error: insertError } = await supabase
      .from('journal_reflections')
      .insert({
        user_id: user.id,
        period,
        reflection_text: reflectionText,
        entry_ids: entryIds,
        themes,
        is_shared_to_kul: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/journal/reflect] Database error inserting reflection:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Mark processed entries as reflected
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({ ai_reflection_generated: true })
      .in('id', entryIds);

    if (updateError) {
      // Log error but don't fail the request since the reflection was already generated & saved successfully
      console.warn('[POST /api/journal/reflect] Failed to mark entries as reflected:', updateError);
    }

    return NextResponse.json({ success: true, data: reflection });
  } catch (err: any) {
    console.error('[POST /api/journal/reflect] Server error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
