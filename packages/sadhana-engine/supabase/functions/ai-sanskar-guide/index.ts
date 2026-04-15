// ============================================================
// ai-sanskar-guide — Personalised sanskar vidhi guide
//
// Given a sanskar slug, generates a complete personalised
// guide: preparation checklist, step-by-step vidhi, mantras,
// samagri list, muhurta advice, and priest guidance.
//
// POST { user_id, sanskar_slug, beneficiary_name?, beneficiary_dob?,
//        family_tradition?, language_pref? }
// → { guide, vidhi_steps, samagri, mantras, muhurta_tips,
//     priest_guidance, sanskar, generated_at }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://mnbwodcswxoojndytngu.supabase.co';
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// J2000 panchang for muhurta context
const J2000_NEW_MOON_MS = 947182440000;
const LUNAR_MONTH_MS    = 29.53058867 * 86400000;

function getTodayTithi(): string {
  const now      = new Date();
  const elapsed  = now.getTime() - J2000_NEW_MOON_MS;
  const lunar    = ((elapsed % LUNAR_MONTH_MS) + LUNAR_MONTH_MS) % LUNAR_MONTH_MS;
  const day      = Math.floor(lunar / (LUNAR_MONTH_MS / 30)) + 1;
  const paksha   = day <= 15 ? 'Shukla' : 'Krishna';
  const tithi    = day <= 15 ? day : day - 15;
  const names    = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya'];
  return `${paksha} ${names[Math.min(tithi - 1, 14)]}`;
}

// Auspicious days per sanskar type
const AUSPICIOUS_GUIDANCE: Record<string, string> = {
  namakarana:    'Best on 11th or 12th day after birth. Shukla paksha is preferred. Avoid Amavasya, Chaturdashi, Ashtami.',
  annaprasana:   '5th or 6th month. Odd month for boys, even for girls (traditional). Shukla paksha, any auspicious nakshatra.',
  chudakarma:    '1st or 3rd year. Auspicious nakshatras: Ashwini, Rohini, Mrigashira, Pushya, Hasta, Shravana, Dhanistha.',
  vidyarambha:   'Vijayadashami (Dussehra) is most auspicious. Also Akshaya Tritiya, Navami in Shukla paksha.',
  upanayana:     'Uttarayana (Jan-Jun) preferred. Best nakshatras: Hasta, Ashwini, Pushya, Shravana. Avoid Krishnapaksha.',
  vivaha:        'Uttarayana preferred. Avoid Adhika masa. Best months: Vaishakha, Jyeshtha, Magha, Phalguna. Muhurata from Panchang is essential.',
  default:       'Consult a Vedic astrologer for the exact muhurta. Generally Shukla paksha on an auspicious nakshatra is preferred.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });

  try {
    const {
      user_id, sanskar_slug,
      beneficiary_name, beneficiary_dob,
      family_tradition, language_pref = 'english',
    } = await req.json();

    if (!user_id)      return new Response(JSON.stringify({ error: 'user_id required' }),      { status: 400 });
    if (!sanskar_slug) return new Response(JSON.stringify({ error: 'sanskar_slug required' }), { status: 400 });

    const supabase  = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    // Fetch sanskar
    const { data: sanskar } = await supabase
      .from('sanskars')
      .select('*')
      .eq('slug', sanskar_slug)
      .single();

    if (!sanskar) return new Response(JSON.stringify({ error: 'sanskar not found' }), { status: 404 });

    // Fetch user profile for tradition
    const { data: profile } = await supabase
      .from('user_practice')
      .select('tradition, preferred_deity')
      .eq('user_id', user_id)
      .single();

    const tradition = family_tradition ?? profile?.tradition ?? 'general';
    const todayTithi = getTodayTithi();
    const muhurtaGuidance = AUSPICIOUS_GUIDANCE[sanskar_slug] ?? AUSPICIOUS_GUIDANCE.default;

    // Fallback: return the static vidhi from DB
    const fallback = {
      guide:           `${sanskar.name} (${sanskar.name_sanskrit}) — ${sanskar.name_meaning}. ${sanskar.significance}`,
      vidhi_steps:     sanskar.vidhi_steps,
      samagri:         sanskar.samagri ?? [],
      mantras:         sanskar.key_mantras ?? [],
      muhurta_tips:    muhurtaGuidance,
      priest_guidance: sanskar.priest_required
        ? 'A qualified Vedic priest (purohit) is required for this sanskar. Contact your local temple or Vedic priest directory.'
        : sanskar.can_self_perform
          ? 'This sanskar can be performed by the family without a priest, though a priest is recommended for full traditional observance.'
          : 'A priest is recommended but not strictly required for this sanskar.',
      sanskar,
      today_tithi:     todayTithi,
      generated_at:    new Date().toISOString(),
    };

    if (!geminiKey) {
      return new Response(JSON.stringify(fallback), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const beneficiaryLine = beneficiary_name
      ? `Beneficiary: ${beneficiary_name}${beneficiary_dob ? ` (born ${beneficiary_dob})` : ''}`
      : 'Beneficiary: not specified';

    const prompt = `You are a learned Vedic priest and scholar. Provide a personalised, practical guide for performing the ${sanskar.name} sanskar.

SANSKAR DETAILS:
Name: ${sanskar.name} (${sanskar.name_sanskrit ?? ''}) — "${sanskar.name_meaning}"
Life stage: ${sanskar.life_stage}, Typical age: ${sanskar.typical_age ?? 'N/A'}
Significance: ${sanskar.significance}
Presiding deity: ${sanskar.presiding_deity ?? 'N/A'}
Priest required: ${sanskar.priest_required}
Duration: ~${sanskar.duration_hours ?? 'variable'} hours

FAMILY DETAILS:
- Tradition: ${tradition}
- ${beneficiaryLine}
- Preferred language: ${language_pref}
- Today's tithi: ${todayTithi}

STANDARD VIDHI (expand and personalise each step):
${JSON.stringify(sanskar.vidhi_steps, null, 2)}

Provide a comprehensive, warm, and practical guide in this exact JSON format (no markdown):
{
  "guide": "3-4 paragraph introduction covering the spiritual meaning, why this is done, and what transformation it brings — personalised to this family's tradition",
  "preparation": "What to do 1-3 days before the sanskar to prepare mentally, physically, and spiritually",
  "vidhi_steps": [{"step": 1, "title": "...", "description": "detailed expanded description with any mantras to be said", "duration_min": 10}],
  "samagri": ["item 1 — why it is used", "item 2 — why it is used"],
  "mantras": [{"mantra": "...", "meaning": "...", "when_to_chant": "..."}],
  "muhurta_tips": "Specific auspicious timing guidance for this sanskar",
  "priest_guidance": "How to find a qualified priest, what to tell them, what dakshina is appropriate",
  "diaspora_note": "Practical guidance for families outside India who may not have easy access to all items or priests"
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
      return new Response(JSON.stringify(fallback), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({
      guide:           parsed.guide,
      preparation:     parsed.preparation,
      vidhi_steps:     parsed.vidhi_steps ?? sanskar.vidhi_steps,
      samagri:         parsed.samagri ?? sanskar.samagri ?? [],
      mantras:         parsed.mantras ?? [],
      muhurta_tips:    parsed.muhurta_tips ?? muhurtaGuidance,
      priest_guidance: parsed.priest_guidance ?? fallback.priest_guidance,
      diaspora_note:   parsed.diaspora_note,
      sanskar,
      today_tithi:     todayTithi,
      generated_at:    new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
