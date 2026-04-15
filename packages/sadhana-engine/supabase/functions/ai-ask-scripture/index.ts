// ============================================================
// Edge Function: ai-ask-scripture
// Semantic search across scripture_chunks + Gemini explanation
//
// POST body:
//   question       string   — user's question
//   user_id        string?  — for profile-aware answers
//   match_count    number   — verses to retrieve (default 5)
//   match_threshold number  — similarity cutoff (default 0.3)
//   text_ids       string[] — filter by text e.g. ['gita']
//   with_explanation bool   — call Gemini (default true)
//
// Deploy:
//   supabase functions deploy ai-ask-scripture
// Secrets needed:
//   supabase secrets set GEMINI_API_KEY=AIza...
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const {
      question,
      user_id,
      match_count = 5,
      match_threshold = 0.3,
      text_ids = null,
      with_explanation = true,
    } = await req.json();

    if (!question) {
      return errorResponse('question is required', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Step 1: Generate query embedding using the same LSA approach ──
    // We use a simple keyword extraction + stored embedding lookup.
    // For production: replace with Gemini embedding API.
    // For now: call the match_scriptures_text function (keyword-based fallback).

    const { data: verses, error: searchError } = await supabase.rpc(
      'match_scriptures_text',
      {
        query_text: question,
        match_count,
        match_threshold,
        filter_text_ids: text_ids,
      }
    );

    if (searchError) {
      // Fallback: keyword search if vector search fails
      console.error('Vector search error:', searchError.message);
      return errorResponse('Scripture search failed: ' + searchError.message, 500);
    }

    const matchedVerses = (verses ?? []) as Array<{
      id: string;
      text_id: string;
      chapter: number;
      verse: number;
      sanskrit: string;
      transliteration: string;
      translation: string;
      commentary: string;
      tags: string[];
      similarity: number;
    }>;

    // ── Step 2: Fetch user profile (optional, for personalisation) ──
    let profile: Record<string, unknown> | null = null;
    if (user_id) {
      const { data: p } = await supabase
        .from('user_practice')
        .select('tradition, content_depth, primary_path, preferred_deity')
        .eq('user_id', user_id)
        .single();
      profile = p;
    }

    // ── Step 3: Gemini explanation ──
    let answer = '';
    if (with_explanation && matchedVerses.length > 0) {
      answer = await generateExplanation(question, matchedVerses, profile);
    } else if (!with_explanation) {
      answer = '';
    } else {
      answer = "I couldn't find relevant verses for your question. Please try rephrasing.";
    }

    // ── Step 4: Format response ──
    const results = matchedVerses.map(v => ({
      verse: {
        id: v.id,
        text_id: v.text_id,
        chapter: v.chapter,
        verse: v.verse,
        sanskrit: v.sanskrit,
        transliteration: v.transliteration,
        translation: v.translation,
        commentary: v.commentary,
        tags: v.tags,
      },
      similarity: Math.round(v.similarity * 1000) / 1000,
    }));

    const sourcesSet = new Set(matchedVerses.map(v => v.text_id));
    const response = {
      question,
      answer,
      verses: results,
      source_texts: [...sourcesSet],
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-ask-scripture error:', err);
    return errorResponse('Internal error', 500);
  }
});

// ── Gemini explanation generator ──

async function generateExplanation(
  question: string,
  verses: Array<{ text_id: string; chapter: number; verse: number; translation: string; transliteration: string }>,
  profile: Record<string, unknown> | null
): Promise<string> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) return verses.map(v => `${v.text_id.toUpperCase()} ${v.chapter}.${v.verse}: ${v.translation}`).join('\n\n');

  const tradition = profile?.tradition ?? 'general';
  const depth = profile?.content_depth ?? 'intermediate';

  const versesText = verses
    .map(v => `${v.text_id.toUpperCase()} ${v.chapter}.${v.verse}:\n  "${v.translation}"\n  (${v.transliteration.split(' / ')[0]})`)
    .join('\n\n');

  const prompt = `You are a knowledgeable and compassionate Sanatani scholar within the Sanatana Sangam spiritual app.

The devotee asked: "${question}"

Relevant scripture verses found:
${versesText}

The devotee's tradition: ${tradition}
Their understanding depth: ${depth}

Please provide a thoughtful, concise answer (3-5 sentences) that:
1. Directly addresses their question using the verses above
2. Cites verses by reference (e.g. "As Krishna says in Gita 2.47...")
3. Uses language appropriate for ${depth} level practitioners
4. Connects to their ${tradition} tradition where relevant
5. Ends with one practical application for daily life

Write in a warm, scholarly tone — like a trusted guru speaking directly to the devotee.`;

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.4 },
    }),
  });

  if (!resp.ok) {
    console.error('Gemini error:', await resp.text());
    return verses[0]?.translation ?? '';
  }

  const json = await resp.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
