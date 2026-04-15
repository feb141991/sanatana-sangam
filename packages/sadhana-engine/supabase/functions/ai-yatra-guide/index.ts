// ============================================================
// ai-yatra-guide — Personalised tirtha preparation guide
//
// Given a tirtha slug or id, generates a complete preparation
// guide: what to bring, mantras to chant, vidhi on arrival,
// what to pray for, and best practices for the darshan.
//
// POST { user_id, tirtha_slug?, tirtha_id?, context? }
// context: 'planning' | 'arriving' | 'completed' (default: 'planning')
// → { guide, mantras, checklist, tirtha, generated_at }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://mnbwodcswxoojndytngu.supabase.co';
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });

  try {
    const { user_id, tirtha_slug, tirtha_id, context = 'planning' } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
    if (!tirtha_slug && !tirtha_id) return new Response(JSON.stringify({ error: 'tirtha_slug or tirtha_id required' }), { status: 400 });

    const supabase  = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    // Fetch tirtha
    let tirthaQuery = supabase.from('tirthas').select('*');
    if (tirtha_id)   tirthaQuery = tirthaQuery.eq('id', tirtha_id);
    else             tirthaQuery = tirthaQuery.eq('slug', tirtha_slug);

    const { data: tirthas } = await tirthaQuery.single();
    if (!tirthas) return new Response(JSON.stringify({ error: 'tirtha not found' }), { status: 404 });

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_practice')
      .select('tradition, preferred_deity, primary_path')
      .eq('user_id', user_id)
      .single();

    // Check if user has visited before
    const { data: visits } = await supabase
      .from('tirtha_visits')
      .select('visited_at, notes')
      .eq('user_id', user_id)
      .eq('tirtha_id', tirthas.id)
      .order('visited_at', { ascending: false });

    const visitCount     = visits?.length ?? 0;
    const lastVisited    = visits?.[0]?.visited_at ?? null;
    const tradition      = profile?.tradition ?? 'general';

    // Fallback guide
    const fallbackGuide = {
      guide:    `${tirthas.name} is a sacred tirtha dedicated to ${tirthas.deity ?? 'the Divine'}. ${tirthas.significance}`,
      mantras:  tirthas.key_mantras ?? [],
      checklist: ['Clean clothes (preferably white or light colours)','Sacred thread or mala','Dakshina for the priest','Flowers and fruits for offering','Empty vessel for sacred water/prasad'],
      tirtha:   tirthas,
      visit_count: visitCount,
      generated_at: new Date().toISOString(),
    };

    if (!geminiKey) {
      return new Response(JSON.stringify(fallbackGuide), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const contextLines: Record<string, string> = {
      planning:   `The devotee is planning a future visit and wants to prepare.`,
      arriving:   `The devotee has just arrived or is about to enter the temple. Give immediate guidance.`,
      completed:  `The devotee just completed the darshan. Help them integrate the experience spiritually.`,
    };

    const previousVisitLine = visitCount > 0
      ? `They have visited before (${visitCount} time${visitCount > 1 ? 's' : ''}, last on ${lastVisited}).`
      : 'This will be their first visit.';

    const prompt = `You are a learned Vedic guide and tirtha purohit. Provide a personalised pilgrimage guide for this devotee.

TIRTHA: ${tirthas.name} (${tirthas.name_sanskrit ?? ''})
Type: ${tirthas.series_name ? `${tirthas.series_name} #${tirthas.series_number}` : tirthas.tirtha_type}
Presiding deity: ${tirthas.deity ?? 'N/A'}
Location: ${tirthas.state}, ${tirthas.country}
Significance: ${tirthas.significance}
Best months: ${(tirthas.best_months ?? []).join(', ')}

DEVOTEE:
- Tradition: ${tradition}
- ${contextLines[context] ?? contextLines.planning}
- ${previousVisitLine}

Provide a practical and spiritually rich guide in this exact JSON format (no markdown):
{
  "guide": "2-3 paragraph personalised guide covering the spiritual significance, what to do there, and how to approach the darshan",
  "arrival_prayer": "A short Sanskrit or vernacular prayer to say upon arriving at the tirtha",
  "mantras": ["primary mantra to chant", "secondary mantra if relevant"],
  "checklist": ["item 1", "item 2", "...up to 8 items to bring or prepare"],
  "darshan_tips": ["tip 1", "tip 2", "...3-5 practical tips specific to this tirtha"],
  "what_to_pray": "Guidance on what to pray for or contemplate at this specific tirtha",
  "post_visit": "What to do after leaving — gratitude practice, prasad distribution, etc."
}`;

    const resp  = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const gData = await resp.json();
    const raw   = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify(fallbackGuide), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({
      guide:         parsed.guide,
      arrival_prayer:parsed.arrival_prayer,
      mantras:       parsed.mantras ?? tirthas.key_mantras ?? [],
      checklist:     parsed.checklist ?? fallbackGuide.checklist,
      darshan_tips:  parsed.darshan_tips ?? [],
      what_to_pray:  parsed.what_to_pray,
      post_visit:    parsed.post_visit,
      tirtha:        tirthas,
      visit_count:   visitCount,
      last_visited:  lastVisited,
      generated_at:  new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
