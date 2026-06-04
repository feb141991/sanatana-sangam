// ============================================================
// ai-shloka-of-day — Personalised daily verse
//
// Picks the most appropriate verse for a user today based on:
//   1. Their active enrollment position (next lesson in their path)
//   2. Panchang (Ekadashi → Gita/Bhagavatam; Purnima → Shiva texts, etc.)
//   3. Their tradition and deity preference
//   4. Their active sankalpa (bridges sadhana engine ↔ Pathshala)
//
// Returns the verse + a short personalised reflection.
// Caches result in the recommendations table (one per user per day).
//
// POST body: { user_id: string }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')   ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── Panchang ──────────────────────────────────────────────────────────────────

const J2000_EPOCH    = 947182440000;
const LUNAR_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000;

function getTithiNumber(): number {
  return Math.floor(((Date.now() - J2000_EPOCH) % LUNAR_MONTH_MS) / LUNAR_MONTH_MS * 30) + 1;
}

const TITHI_NAMES = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima',
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya',
];

const VAARA_NAMES = ['Ravivara','Somavara','Mangalavara','Budhavara','Guruvara','Shukravara','Shanivara'];

interface Panchang {
  tithi:       string;
  tithiNum:    number;
  paksha:      string;
  vaara:       string;
  isEkadashi:  boolean;
  isPurnima:   boolean;
  isAmavasya:  boolean;
  isPradosh:   boolean;   // Trayodashi
  isSankashti: boolean;   // Krishna Chaturthi
  isVinayaki:  boolean;   // Shukla Chaturthi
}

function getPanchang(): Panchang {
  const n        = getTithiNumber();
  const tithi    = TITHI_NAMES[(n - 1) % 30];
  const paksha   = n <= 15 ? 'Shukla Paksha' : 'Krishna Paksha';
  const vaara    = VAARA_NAMES[new Date().getDay()];
  return {
    tithi,
    tithiNum:    n,
    paksha,
    vaara,
    isEkadashi:  tithi === 'Ekadashi',
    isPurnima:   tithi === 'Purnima',
    isAmavasya:  tithi === 'Amavasya',
    isPradosh:   tithi === 'Trayodashi',
    isSankashti: tithi === 'Chaturthi' && paksha === 'Krishna Paksha',
    isVinayaki:  tithi === 'Chaturthi' && paksha === 'Shukla Paksha',
  };
}

// ── Special day → text preference ────────────────────────────────────────────

function specialDayTextHint(p: Panchang, tradition: string): string | null {
  if (p.isEkadashi)  return 'Bhagavad Gita or Bhagavata Purana preferred on Ekadashi';
  if (p.isPurnima)   return tradition === 'shaiva'
    ? 'Shiva Purana or stotra preferred on Purnima'
    : 'Bhagavata Purana or devotional stotra preferred on Purnima';
  if (p.isAmavasya)  return 'Ancestors (pitru) related verses or Katha Upanishad preferred on Amavasya';
  if (p.isPradosh)   return tradition === 'shaiva'
    ? 'Shiva Mahimna Stotra or Rudrashtakam preferred on Pradosh (Trayodashi)'
    : null;
  if (p.isSankashti || p.isVinayaki)
                     return 'Ganesha stotra or Mudgala Purana preferred on Chaturthi';
  if (p.vaara === 'Somavara' && tradition === 'shaiva')
                     return 'Shiva texts preferred on Monday (Somavara)';
  if (p.vaara === 'Guruvara') return 'Guru stotra or Brihaspati-related verse preferred on Thursday';
  return null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
    }

    const supabase   = createClient(SUPABASE_URL, SERVICE_KEY);
    const today      = new Date().toISOString().split('T')[0];

    // ── 1. Check cache (recommendations table) ─────────────────────────────────
    const { data: cached } = await supabase
      .from('recommendations')
      .select('content')
      .eq('user_id',  user_id)
      .eq('date',     today)
      .eq('type',     'shloka_of_day')
      .maybeSingle();

    if (cached?.content) {
      return new Response(JSON.stringify({ ...cached.content, cached: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ── 2. Fetch user profile ──────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('user_practice')
      .select('tradition, preferred_deity, primary_path, content_depth, current_streak')
      .eq('user_id', user_id)
      .single();

    const tradition = profile?.tradition    ?? 'smarta';
    const deity     = profile?.preferred_deity ?? 'Ishvara';
    const depth     = profile?.content_depth  ?? 'beginner';
    const streak    = profile?.current_streak ?? 0;

    // ── 3. Fetch active enrollment (primary path) ──────────────────────────────
    const { data: enrollment } = await supabase
      .from('pathshala_enrollments')
      .select(`
        id, current_position, path_id,
        pathshala_paths ( slug, title, language, text_category )
      `)
      .eq('user_id', user_id)
      .eq('paused',  false)
      .is('completed_at', null)
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ── 4. Fetch active sankalpa ───────────────────────────────────────────────
    const { data: sankalpa } = await supabase
      .from('sankalpa')
      .select('type, description, mantra_id')
      .eq('user_id', user_id)
      .eq('status',  'active')
      .limit(1)
      .maybeSingle();

    // ── 5. Panchang ───────────────────────────────────────────────────────────
    const panchang   = getPanchang();
    const specialDay = specialDayTextHint(panchang, tradition);

    // ── 6. Candidate chunk selection ──────────────────────────────────────────
    let chunk: Record<string, unknown> | null = null;
    let source = 'random';

    // A: Next chunk from active enrollment (highest priority unless special day)
    if (enrollment && !panchang.isEkadashi && !panchang.isPurnima && !panchang.isAmavasya) {
      const { data: pathChunk } = await supabase
        .from('pathshala_path_chunks')
        .select('chunk_id')
        .eq('path_id',  enrollment.path_id)
        .eq('position', enrollment.current_position)
        .maybeSingle();

      if (pathChunk) {
        const { data: c } = await supabase
          .from('scripture_chunks')
          .select('id, text_id, chapter, verse, sanskrit, transliteration, translation, commentary, tags, text_category, language')
          .eq('id', pathChunk.chunk_id)
          .single();
        if (c) { chunk = c; source = 'enrollment'; }
      }
    }

    // B: Special day — pick from appropriate text category
    if (!chunk && specialDay) {
      const categoryMap: Record<string, string[]> = {
        Ekadashi:  ['smriti','purana'],
        Purnima:   ['purana','stotra'],
        Amavasya:  ['shruti','purana'],
        Pradosh:   ['stotra','shruti'],
        Chaturthi: ['stotra'],
      };
      const tithiKey = Object.keys(categoryMap).find(k =>
        specialDay.toLowerCase().includes(k.toLowerCase())
      );
      const cats = tithiKey ? categoryMap[tithiKey] : ['smriti'];

      const { data: c } = await supabase
        .from('scripture_chunks')
        .select('id, text_id, chapter, verse, sanskrit, transliteration, translation, commentary, tags, text_category, language')
        .in('text_category', cats)
        .limit(50)
        .then(({ data }) => ({
          data: data && data.length > 0
            ? data[Math.floor(Math.random() * data.length)]
            : null,
        }));
      if (c) { chunk = c; source = 'special_day'; }
    }

    // C: Tradition-based fallback — random from relevant text categories
    if (!chunk) {
      const traditionCats: Record<string, string[]> = {
        vaishnava: ['smriti','purana'],
        shaiva:    ['shruti','stotra','agama'],
        shakta:    ['stotra','tantra','purana'],
        sant:      ['doha','bhakti'],
        jnana:     ['shruti','darshana'],
        smarta:    ['smriti','shruti','purana'],
      };
      const cats = traditionCats[tradition] ?? ['smriti'];

      const { data: rows } = await supabase
        .from('scripture_chunks')
        .select('id, text_id, chapter, verse, sanskrit, transliteration, translation, commentary, tags, text_category, language')
        .in('text_category', cats)
        .limit(100);

      if (rows && rows.length > 0) {
        chunk  = rows[Math.floor(Math.random() * rows.length)];
        source = 'tradition';
      }
    }

    // D: Absolute fallback — any chunk
    if (!chunk) {
      const { data: rows } = await supabase
        .from('scripture_chunks')
        .select('id, text_id, chapter, verse, sanskrit, transliteration, translation, commentary, tags, text_category, language')
        .limit(50);
      if (rows && rows.length > 0) {
        chunk  = rows[Math.floor(Math.random() * rows.length)];
        source = 'fallback';
      }
    }

    if (!chunk) {
      return new Response(JSON.stringify({ error: 'no scripture chunks found' }), { status: 404 });
    }

    // ── 7. Generate personalised reflection via Gemini ─────────────────────────
    const prompt = `You are a warm, knowledgeable spiritual guide in the ${tradition} tradition.

Today is ${panchang.vaara}, ${panchang.tithi} (${panchang.paksha}).
${specialDay ? `Special significance: ${specialDay}.` : ''}

The practitioner's profile:
- Tradition: ${tradition}, Deity: ${deity}
- Path: ${profile?.primary_path ?? 'devotion'}, Depth: ${depth}
- Sadhana streak: ${streak} days
${sankalpa ? `- Active sankalpa: "${sankalpa.description}"` : ''}

Today's verse:
Text: ${chunk.text_id} ${chunk.chapter ? `Ch.${chunk.chapter}` : ''} ${chunk.verse ? `v.${chunk.verse}` : ''}
Original: ${chunk.sanskrit ?? ''}
Translation: ${chunk.translation ?? ''}

Write a SHORT, warm "Shloka of the Day" message — 3–5 sentences:
1. Note what today (${panchang.tithi}) means spiritually (1 sentence).
2. Introduce the verse and its core teaching (1–2 sentences).
3. One practical suggestion for how to carry this teaching into today's practice.
${sankalpa ? `4. If natural, connect this to their sankalpa: "${sankalpa.description}".` : ''}

Be warm, direct, and inspiring. Address them as a sincere seeker. Respond in English.`;

    let reflection = `On this ${panchang.tithi}, reflect on this teaching from ${chunk.text_id}. ${chunk.translation ?? ''}`;

    if (GEMINI_API_KEY) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
          }),
        }
      );

      if (geminiRes.ok) {
        const d = await geminiRes.json();
        reflection = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? reflection;
      }
    }

    // ── 8. Build response payload ─────────────────────────────────────────────
    const payload = {
      chunk_id:        chunk.id,
      text_id:         chunk.text_id,
      chapter:         chunk.chapter,
      verse:           chunk.verse,
      original:        chunk.sanskrit,
      transliteration: chunk.transliteration,
      translation:     chunk.translation,
      text_category:   chunk.text_category,
      language:        chunk.language,
      reflection,
      panchang: {
        tithi:       panchang.tithi,
        paksha:      panchang.paksha,
        vaara:       panchang.vaara,
        is_ekadashi: panchang.isEkadashi,
        is_purnima:  panchang.isPurnima,
        special_day: specialDay,
      },
      source,
      enrollment_context: enrollment
        ? { path_id: enrollment.path_id, position: enrollment.current_position }
        : null,
      generated_at: new Date().toISOString(),
      cached: false,
    };

    // ── 9. Cache in recommendations table ─────────────────────────────────────
    await supabase.from('recommendations').upsert({
      user_id,
      date:         today,
      type:         'shloka_of_day',
      content:      payload,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date,type' });

    return new Response(
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (err) {
    console.error('[ai-shloka-of-day]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
