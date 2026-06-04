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

    const body = await req.json().catch(() => null) as {
      name?: string;
      tradition?: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
    } | null;

    const name = body?.name?.trim();
    const tradition = body?.tradition || 'all';

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!['hindu', 'sikh', 'buddhist', 'jain', 'all'].includes(tradition)) {
      return NextResponse.json({ error: 'Invalid tradition' }, { status: 400 });
    }

    // Check if the user already has a name story
    const { data: existingStory, error: fetchError } = await supabase
      .from('name_stories')
      .select('generated_at, share_slug')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[POST /api/name-story/generate] Error checking existing story:', fetchError);
    }

    // Apply 30-day regeneration limit for existing stories
    if (existingStory) {
      const generatedAt = new Date(existingStory.generated_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - generatedAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        const remainingDays = 30 - diffDays;
        return NextResponse.json({
          error: `You can only regenerate your name story once every 30 days. Please wait ${remainingDays} more day(s).`,
          existingSlug: existingStory.share_slug
        }, { status: 400 });
      }
    }

    const systemPrompt = `You are a master of Sanskrit, Gurmukhi, Pali, Prakrit, and dharmic etymology.
Your task is to analyze the name "${name}" through the lens of the "${tradition}" tradition and return a structured JSON response about its spiritual significance.

Please follow these guidelines for the fields:
1. "origin_tradition": Specify the linguistic and traditional origin (e.g., Sanskrit (Hindu), Gurmukhi (Sikh), Pali (Buddhist), Prakrit (Jain)).
2. "etymology_text": Provide a deep, insightful analysis of the name's linguistic roots. Include the original script (Devanagari for Sanskrit/Hindi/Prakrit, Gurmukhi for Punjabi, or native script for Pali/Sanskrit) and break down its root words (e.g., "Deva" + "Indra" = king of gods). Explain the literal and spiritual meaning of these roots.
3. "deity_connection": Describe any connection to deities, Gurus, avatars, Bodhisattvas, Tirthankaras, or divine qualities associated with this name.
4. "historical_bearers": An array of 2-4 notable historical, mythological, or scriptural figures who bore this name.
5. "meaning_summary": A beautiful, concise one-sentence summary of the name's spiritual essence.
6. "scripture_line": Provide an uplifting, relevant verse or line from the sacred texts of the tradition (e.g. Bhagavad Gita, Upanishads, Guru Granth Sahib, Dhammapada, Tattvartha Sutra, etc.) that directly aligns with the meaning or spirit of the name. Write it in its original script (Devanagari, Gurmukhi, etc.) followed by its English transliteration and English translation.
7. "scripture_source": The exact scripture citation (e.g., "Bhagavad Gita 2.47", "SGGS Ang 1", "Dhammapada Verse 1").

Your output must be a single, valid JSON object with EXACTLY the keys:
"etymology_text", "deity_connection", "origin_tradition", "historical_bearers", "meaning_summary", "scripture_line", "scripture_source".
Do not include any extra text, markdown wrappers, or explanations outside the JSON. Respond ONLY with valid JSON.`;

    const userMessage = `Generate the spiritual name story for the name "${name}" in the "${tradition}" tradition.`;

    const aiResult = await generateWithProvider(
      { system: systemPrompt, user: userMessage, maxOutputTokens: 1500 },
      { responseFormat: 'json' }
    );
    let responseText = (aiResult.text ?? '').trim();

    // Strip markdown code blocks if present
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[POST /api/name-story/generate] Failed to parse Claude response:', responseText);
      return NextResponse.json({ error: 'AI returned invalid structured content. Please try again.' }, { status: 502 });
    }

    // Generate unique share slug (only if not existing yet)
    let shareSlug = existingStory?.share_slug;
    if (!shareSlug) {
      const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const randomChars = Math.random().toString(36).substring(2, 7);
      shareSlug = `${nameSlug}-${randomChars}`;
    }

    // Upsert the name story record
    const { data: nameStory, error: upsertError } = await supabase
      .from('name_stories')
      .upsert({
        user_id: user.id,
        name_input: name,
        tradition,
        etymology_text: parsedData.etymology_text || '',
        deity_connection: parsedData.deity_connection || '',
        origin_tradition: parsedData.origin_tradition || '',
        historical_bearers: parsedData.historical_bearers || [],
        meaning_summary: parsedData.meaning_summary || '',
        scripture_line: parsedData.scripture_line || '',
        scripture_source: parsedData.scripture_source || '',
        generated_at: new Date().toISOString(),
        is_public: true,
        share_slug: shareSlug
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[POST /api/name-story/generate] Database error saving name story:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: nameStory });
  } catch (err: any) {
    console.error('[POST /api/name-story/generate] Server error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
