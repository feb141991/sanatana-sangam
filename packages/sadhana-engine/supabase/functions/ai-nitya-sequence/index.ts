// ============================================================
// ai-nitya-sequence — Personalised morning ritual sequence
//
// Returns a sequenced morning sadhana routine personalised
// to the user's tradition, available time, and today's panchang.
//
// POST { user_id, date?, available_minutes? }
// → { sequence: Step[], greeting, panchang_context, generated_at }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://mnbwodcswxoojndytngu.supabase.co';
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// J2000 astronomical panchang (same as ai-personalise)
const J2000_NEW_MOON_MS  = 947182440000;
const LUNAR_MONTH_MS     = 29.53058867 * 86400000;

function computeAstroPanchang(date: Date) {
  const elapsed    = date.getTime() - J2000_NEW_MOON_MS;
  const lunarElapsed = ((elapsed % LUNAR_MONTH_MS) + LUNAR_MONTH_MS) % LUNAR_MONTH_MS;
  const lunarDay   = Math.floor(lunarElapsed / (LUNAR_MONTH_MS / 30)) + 1;

  const paksha     = lunarDay <= 15 ? 'Shukla' : 'Krishna';
  const tithi_num  = lunarDay <= 15 ? lunarDay : lunarDay - 15;
  const tithi_names = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya'];
  const tithi      = tithi_names[Math.min(tithi_num - 1, 14)];

  const vaara      = ['Ravivar','Somvar','Mangalvar','Budhvar','Guruvar','Shukravar','Shanivar'][date.getDay()];

  let vrata: string | null = null;
  if (tithi_num === 11) vrata = 'Ekadashi';
  else if (tithi_num === 13 || lunarDay === 28) vrata = 'Pradosh';
  else if (tithi_num === 4 && paksha === 'Shukla') vrata = 'Vinayaka Chaturthi';
  else if (lunarDay === 15) vrata = 'Purnima';
  else if (lunarDay === 30) vrata = 'Amavasya';
  else if (tithi_num === 8 && paksha === 'Krishna') vrata = 'Kalashtami';

  const vaara_vrata: Record<string,string> = {
    'Somvar': 'Somvar vrat (Shiva)', 'Mangalvar': 'Mangalvar vrat (Hanuman/Devi)',
    'Guruvar': 'Guruvar vrat (Vishnu/Guru)', 'Shukravar': 'Shukravar vrat (Devi Lakshmi)',
    'Shanivar': 'Shanivar vrat (Shani/Hanuman)',
  };

  return { tithi, tithi_num, paksha, lunarDay, vrata, vaara, vaara_vrata: vaara_vrata[vaara] ?? null };
}

// Default sequence steps (all 7)
const ALL_STEPS = [
  { id: 'woke_brahma_muhurta', label: 'Wake at Brahma Muhurta',  minutes: 5,  icon: '🌅', description: 'Rise before sunrise — the most sattvic hour. Avoid checking phone. Drink copper-vessel water.' },
  { id: 'snana_done',          label: 'Snana — ritual bath',     minutes: 10, icon: '🪣', description: 'Cold or cool bath. Mentally offer the bath to Ganga Mata. Chant: Om Apavitrah Pavitro Va...' },
  { id: 'tilak_done',          label: 'Tilak & Tilak',           minutes: 3,  icon: '🔴', description: 'Apply tilak to the forehead — gopi-chandana, vibhuti, or kumkum as per your tradition. This marks you as a devotee.' },
  { id: 'sandhya_done',        label: 'Sandhya Vandana',         minutes: 15, icon: '🙏', description: 'Sandhya vandana prayer sequence. Includes Achamana, Pranayama, Arghya, and Gayatri japa.' },
  { id: 'japa_done',           label: 'Morning Japa',            minutes: 20, icon: '📿', description: 'Japa of your ishta mantra. Minimum 1 mala (108 beads). Face east or north.' },
  { id: 'shloka_done',         label: 'Shloka Svadhyaya',        minutes: 10, icon: '📖', description: 'Read one chapter or a few verses from your chosen shastra. Contemplate the meaning.' },
  { id: 'aarti_done',          label: 'Aarti & Diya',            minutes: 5,  icon: '🪔', description: 'Light a diya at the home shrine. Offer flowers and incense. Sing or listen to morning aarti.' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });

  try {
    const { user_id, date: dateStr, available_minutes = 60 } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const today    = dateStr ? new Date(dateStr) : new Date();
    const panchang = computeAstroPanchang(today);
    const dateKey  = today.toISOString().split('T')[0];

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_practice')
      .select('tradition, preferred_deity, primary_path, preferred_time')
      .eq('user_id', user_id)
      .single();

    // Fetch today's nitya karma log
    const { data: log } = await supabase
      .from('nitya_karma_log')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', dateKey)
      .single();

    // Build personalised sequence based on available time
    const totalMinutes = Number(available_minutes);
    let steps = [...ALL_STEPS];

    // If short on time, deprioritise snana (still recommended) and shorten japa
    if (totalMinutes < 30) {
      steps = steps.filter(s => !['snana_done'].includes(s.id));
      const japa = steps.find(s => s.id === 'japa_done');
      if (japa) japa.minutes = 5;
    }

    // Mark completed steps
    const stepsWithStatus = steps.map(step => ({
      ...step,
      completed: log ? (log as Record<string, unknown>)[step.id] === true : false,
    }));

    // Tradition-specific guidance
    const traditionGuidance: Record<string, string> = {
      vaishnav: 'Chant your ishta mantra — Hare Krishna Mahamantra or Om Namo Narayanaya. Apply Vaishnava tilak (gopi-chandana U-shape).',
      shaiv:    'Chant Om Namah Shivaya or Mahamrityunjaya. Apply vibhuti (sacred ash) tilak.',
      shakta:   'Chant your Devi mantra — Om Aim Hreem Kleem or your specific Devi mantra. Apply kumkum tilak.',
      smarta:   'Chant Gayatri mantra 108 times after Sandhya vandana. Apply chandana tilak.',
      general:  'Chant Om or Gayatri. Light a diya and offer silent prayer.',
    };

    const tradition  = profile?.tradition ?? 'general';
    const deity      = profile?.preferred_deity ?? 'Ishvara';
    const tradGuide  = traditionGuidance[tradition] ?? traditionGuidance.general;

    // Build Gemini prompt
    const panchangLine = [
      `Today is ${panchang.vaara}, ${panchang.paksha} ${panchang.tithi}`,
      panchang.vrata && `Vrata: ${panchang.vrata}`,
      panchang.vaara_vrata && `Day observance: ${panchang.vaara_vrata}`,
    ].filter(Boolean).join(' · ');

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    let greeting    = `Hari Om. ${panchangLine}. Begin your sadhana with devotion.`;

    if (geminiKey) {
      const prompt = `You are a Vedic spiritual guide. Write a warm, personalised morning greeting (2-3 sentences) for a devotee starting their nitya karma (daily ritual) right now.

Devotee profile:
- Tradition: ${tradition}
- Ishta devata: ${deity}
- Today: ${panchangLine}
- Available time: ${totalMinutes} minutes

Guidelines:
- Reference today's panchang (tithi/vrata) naturally
- Speak directly ("Your practice today...", "Jai Shri...")
- Make it uplifting and grounding
- End with a short relevant mantra or blessing
- Do not use bullet points

Reply with the greeting only, no extra formatting.`;

      try {
        const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const gData = await resp.json();
        const text = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) greeting = text;
      } catch { /* use fallback */ }
    }

    return new Response(JSON.stringify({
      sequence:          stepsWithStatus,
      greeting,
      panchang_context: {
        ...panchang,
        tradition_guidance: tradGuide,
      },
      log,
      generated_at: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
