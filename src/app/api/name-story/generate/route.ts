import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';
import {
  NAME_STORY_INTENTS,
  isNameStoryIntent,
  isNameStorySourceConfidence,
  isNameStoryTradition,
  isNameStoryTranslationLanguage,
  normalizeFirstName,
  type NameStoryIntent,
  type NameStorySourceConfidence,
  type NameStoryTradition,
  type NameStoryTranslationLanguage,
} from '@/lib/name-story';

const MAX_NAME_STORY_BODY_BYTES = 8 * 1024;
const NAME_STORY_RATE_LIMIT = { keyPrefix: 'name-story-generate', limit: 10, windowMs: 60_000 };

type NameStoryRequest = {
  displayName?: string;
  name: string;
  confirmedFirstName?: string;
  nativeScript?: string;
  transliteration?: string;
  tradition: NameStoryTradition;
  translationLanguage: NameStoryTranslationLanguage;
  intent: NameStoryIntent[];
};

type NameStoryAiResponse = {
  origin_tradition: string;
  normalized_first_name: string;
  name_native_script: string;
  name_transliteration: string;
  sacred_meaning: string;
  name_story: string;
  inner_quality: string;
  life_blessing: string;
  practice_suggestion: string;
  name_mantra: string;
  name_mantra_translation: string;
  scripture_original: string;
  scripture_transliteration: string;
  scripture_translation: string;
  scripture_translation_language: string;
  scripture_source: string;
  source_confidence: NameStorySourceConfidence;
  source_note: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseRequestBody(value: unknown): { data?: NameStoryRequest; error?: string } {
  if (!isRecord(value)) return { error: 'Invalid request body' };

  const rawName = stringValue(value.name);
  const rawConfirmedFirstName = stringValue(value.confirmedFirstName);
  const firstName = normalizeFirstName(rawConfirmedFirstName || rawName);
  if (!firstName) return { error: 'First name is required' };

  if (value.tradition !== undefined && !isNameStoryTradition(value.tradition)) {
    return { error: 'Invalid tradition' };
  }

  if (value.translationLanguage !== undefined && !isNameStoryTranslationLanguage(value.translationLanguage)) {
    return { error: 'Invalid translation language' };
  }

  const tradition = isNameStoryTradition(value.tradition) ? value.tradition : 'all';
  const translationLanguage = isNameStoryTranslationLanguage(value.translationLanguage)
    ? value.translationLanguage
    : tradition === 'sikh'
      ? 'pa'
      : tradition === 'hindu'
        ? 'hi'
        : 'en';

  const intent = Array.isArray(value.intent)
    ? value.intent.filter(isNameStoryIntent)
    : [];
  const normalizedIntent = intent.length > 0
    ? Array.from(new Set(intent))
    : NAME_STORY_INTENTS.filter((item) => (
      item === 'sacred_meaning' ||
      item === 'scripture_connection' ||
      item === 'inner_quality' ||
      item === 'name_mantra'
    ));

  return {
    data: {
      displayName: stringValue(value.displayName) || rawName || firstName,
      name: firstName,
      confirmedFirstName: firstName,
      nativeScript: stringValue(value.nativeScript),
      transliteration: stringValue(value.transliteration),
      tradition,
      translationLanguage,
      intent: normalizedIntent,
    },
  };
}

function parseAiResponse(value: unknown): NameStoryAiResponse | null {
  if (!isRecord(value)) return null;

  const sourceConfidence = isNameStorySourceConfidence(value.source_confidence)
    ? value.source_confidence
    : 'interpretive';

  return {
    origin_tradition: stringValue(value.origin_tradition),
    normalized_first_name: normalizeFirstName(stringValue(value.normalized_first_name)),
    name_native_script: stringValue(value.name_native_script),
    name_transliteration: stringValue(value.name_transliteration),
    sacred_meaning: stringValue(value.sacred_meaning),
    name_story: stringValue(value.name_story),
    inner_quality: stringValue(value.inner_quality),
    life_blessing: stringValue(value.life_blessing),
    practice_suggestion: stringValue(value.practice_suggestion),
    name_mantra: stringValue(value.name_mantra),
    name_mantra_translation: stringValue(value.name_mantra_translation),
    scripture_original: stringValue(value.scripture_original),
    scripture_transliteration: stringValue(value.scripture_transliteration),
    scripture_translation: stringValue(value.scripture_translation),
    scripture_translation_language: stringValue(value.scripture_translation_language),
    scripture_source: stringValue(value.scripture_source),
    source_confidence: sourceConfidence,
    source_note: stringValue(value.source_note),
  };
}

function recoverJsonResponse(responseText: string): string {
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  }

  if (cleaned && !cleaned.endsWith('}')) {
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      const lastComplete = cleaned.lastIndexOf('",');
      if (lastComplete > 0) {
        cleaned = `${cleaned.slice(0, lastComplete + 1)}}`;
      }
    }
  }

  return cleaned;
}

function buildLegacyScriptureLine(ai: NameStoryAiResponse): string {
  return [
    ai.scripture_original,
    ai.scripture_transliteration,
    ai.scripture_translation,
  ].filter(Boolean).join('\n\n');
}

function buildSystemPrompt() {
  return `You are Shoonaya's Dharmic Name Story guide.

You are trained in Sanskrit, Hindi, Punjabi/Gurmukhi, Pali, Prakrit, and dharmic naming traditions. Your task is to create a spiritually meaningful, culturally careful Name Story for a person's FIRST NAME ONLY.

Critical rules:
1. Generate only for the confirmed first name.
2. Do not interpret surname, caste name, family name, gotra, or title as part of the sacred name meaning.
3. Do not invent historical bearers, gurus, saints, rishis, or scriptural figures.
4. If the name has a clear classical derivation, say so with confidence.
5. If the derivation is interpretive or uncertain, be transparent and set source_confidence accordingly.
6. Separate linguistic meaning from spiritual reflection.
7. Do not overclaim. Do not say "this name means" unless it is linguistically supportable.
8. The story should feel personal, warm, and shareable, not like a dictionary entry.
9. Scripture must be short, relevant, and tradition-aligned.
10. Scripture translation must be in the requested translation language.
11. If translation language is unsupported for the tradition, use the closest appropriate language: Hindu uses Hindi fallback, Sikh uses Punjabi fallback, Buddhist/Jain/all use English fallback.
12. Keep the tone devotional, grounded, and non-preachy.
13. Avoid sectarian superiority.
14. Return only valid JSON.`;
}

function buildUserPrompt(request: NameStoryRequest) {
  return `Create a Name Story using the following confirmed details:

Display name: ${request.displayName || request.name}
Confirmed first name: ${request.confirmedFirstName || request.name}
Native script spelling, if provided: ${request.nativeScript || 'not provided'}
Transliteration, if provided: ${request.transliteration || 'not provided'}
Tradition focus: ${request.tradition}
Translation language: ${request.translationLanguage}
User wants to explore: ${request.intent.join(', ')}

Output must be a single JSON object with exactly these keys:

{
  "origin_tradition": string,
  "normalized_first_name": string,
  "name_native_script": string,
  "name_transliteration": string,
  "sacred_meaning": string,
  "name_story": string,
  "inner_quality": string,
  "life_blessing": string,
  "practice_suggestion": string,
  "name_mantra": string,
  "name_mantra_translation": string,
  "scripture_original": string,
  "scripture_transliteration": string,
  "scripture_translation": string,
  "scripture_translation_language": string,
  "scripture_source": string,
  "source_confidence": "classical" | "interpretive" | "uncertain",
  "source_note": string
}

Field guidance:
- sacred_meaning: one concise sentence.
- name_story: 120-180 words, emotionally resonant, first-name focused.
- inner_quality: one paragraph about the quality the name invites.
- life_blessing: one short blessing.
- practice_suggestion: one simple daily practice connected to the name.
- name_mantra: one short affirmation or mantra-like line.
- name_mantra_translation: translation in requested language.
- scripture_original: original script.
- scripture_transliteration: roman transliteration.
- scripture_translation: requested language translation.
- scripture_source: exact citation.
- source_note: explain what is classical vs interpretive.

For the name "Sakshi" in Hindu/Hindi:
- Do not analyze "Sharma".
- Appropriate concept: sākṣī / witness consciousness.
- Appropriate scripture: Bhagavad Gita 2.20 or a witness-consciousness Upanishadic line.
- Hindi scripture translation should be natural and readable.`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Server error';
}

export async function POST(req: NextRequest) {
  const sizeRejection = rejectLargeRequest(req, MAX_NAME_STORY_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const rateRejection = rateLimitByIp(req, NAME_STORY_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsedBody = parseRequestBody(await req.json().catch(() => null));
    if (!parsedBody.data) {
      return NextResponse.json({ error: parsedBody.error ?? 'Invalid request body' }, { status: 400 });
    }

    const requestBody = parsedBody.data;
    const firstName = requestBody.confirmedFirstName || requestBody.name;

    const { data: existingStory, error: fetchError } = await supabase
      .from('name_stories')
      .select('generated_at, share_slug')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[POST /api/name-story/generate] Error checking existing story:', fetchError);
    }

    if (existingStory) {
      const generatedAt = new Date(existingStory.generated_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - generatedAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        const remainingDays = 30 - diffDays;
        return NextResponse.json({
          error: `You can only regenerate your name story once every 30 days. Please wait ${remainingDays} more day(s).`,
          existingSlug: existingStory.share_slug,
        }, { status: 400 });
      }
    }

    const aiResult = await generateWithProvider(
      {
        system: buildSystemPrompt(),
        user: buildUserPrompt(requestBody),
        maxOutputTokens: 3072,
      },
      { responseFormat: 'json' }
    );
    const responseText = recoverJsonResponse(aiResult.text ?? '');

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      console.error('[POST /api/name-story/generate] Failed to parse AI response:', responseText.slice(0, 300));
      return NextResponse.json({ error: 'AI returned invalid structured content. Please try again.' }, { status: 502 });
    }

    const aiData = parseAiResponse(parsedJson);
    if (!aiData) {
      return NextResponse.json({ error: 'AI returned an unexpected content shape. Please try again.' }, { status: 502 });
    }

    const normalizedAiFirstName = aiData.normalized_first_name || firstName;
    const nameSlug = normalizedAiFirstName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'name';

    let shareSlug = existingStory?.share_slug;
    if (!shareSlug) {
      const randomChars = Math.random().toString(36).substring(2, 7);
      shareSlug = `${nameSlug}-${randomChars}`;
    }

    const legacyScriptureLine = buildLegacyScriptureLine(aiData);

    const { data: nameStory, error: upsertError } = await supabase
      .from('name_stories')
      .upsert({
        user_id: user.id,
        name_input: firstName,
        display_name: requestBody.displayName || firstName,
        normalized_first_name: normalizedAiFirstName,
        name_native_script: aiData.name_native_script || requestBody.nativeScript || null,
        name_transliteration: aiData.name_transliteration || requestBody.transliteration || null,
        user_intent: requestBody.intent,
        translation_language: requestBody.translationLanguage,
        tradition: requestBody.tradition,
        etymology_text: aiData.source_note || aiData.sacred_meaning || '',
        deity_connection: aiData.inner_quality || null,
        origin_tradition: aiData.origin_tradition || '',
        historical_bearers: [],
        meaning_summary: aiData.sacred_meaning || '',
        sacred_meaning: aiData.sacred_meaning || null,
        name_story: aiData.name_story || null,
        inner_quality: aiData.inner_quality || null,
        life_blessing: aiData.life_blessing || null,
        practice_suggestion: aiData.practice_suggestion || null,
        name_mantra: aiData.name_mantra || null,
        name_mantra_translation: aiData.name_mantra_translation || null,
        scripture_line: legacyScriptureLine,
        scripture_original: aiData.scripture_original || null,
        scripture_transliteration: aiData.scripture_transliteration || null,
        scripture_translation: aiData.scripture_translation || null,
        scripture_translation_language: aiData.scripture_translation_language || requestBody.translationLanguage,
        scripture_source: aiData.scripture_source || '',
        source_confidence: aiData.source_confidence,
        source_note: aiData.source_note || null,
        generated_at: new Date().toISOString(),
        is_public: true,
        share_slug: shareSlug,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[POST /api/name-story/generate] Database error saving name story:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: nameStory });
  } catch (error: unknown) {
    console.error('[POST /api/name-story/generate] Server error:', error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
