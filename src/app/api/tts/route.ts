import { NextRequest, NextResponse } from 'next/server';

// Detect Devanagari script — covers Sanskrit, Hindi, Marathi
function hasDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text);
}

// Detect Gurmukhi (Punjabi / Gurbani)
function hasGurmukhi(text: string): boolean {
  return /[਀-੿]/.test(text);
}

// Detect any Indic script broadly
function hasIndicScript(text: string): boolean {
  return hasDevanagari(text) || hasGurmukhi(text);
}

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

function pickVoice(text: string): VoiceConfig {
  if (hasDevanagari(text)) {
    // sa-IN — actual Sanskrit locale; Standard-A is a clear female voice
    return { languageCode: 'sa-IN', name: 'sa-IN-Standard-A', ssmlGender: 'FEMALE' };
  }
  if (hasGurmukhi(text)) {
    return { languageCode: 'pa-IN', name: 'pa-IN-Standard-A', ssmlGender: 'FEMALE' };
  }
  // Default: clear Indian-English reading voice for transliterations
  return { languageCode: 'en-IN', name: 'en-IN-Standard-A', ssmlGender: 'FEMALE' };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TTS not configured — set GOOGLE_TTS_API_KEY' },
      { status: 503 }
    );
  }

  let text: string;
  let rate: number;

  try {
    const body = await req.json();
    text = String(body.text ?? '').trim();
    rate = Number(body.rate ?? 0.82);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // Cap rate to valid range [0.25, 4.0]
  rate = Math.max(0.25, Math.min(4.0, rate));

  const voice = pickVoice(text);

  const payload = {
    input: { text },
    voice,
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: rate,
      pitch: -1.5,            // Slightly lower pitch sounds more meditative / authoritative
      effectsProfileId: [],   // No DSP effects — pure voice
    },
  };

  try {
    const gRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!gRes.ok) {
      const errText = await gRes.text();
      console.error('[TTS] Google API error:', gRes.status, errText);
      return NextResponse.json(
        { error: 'TTS upstream error', detail: gRes.status },
        { status: 502 }
      );
    }

    const data = await gRes.json() as { audioContent: string };
    return NextResponse.json({ audioContent: data.audioContent });

  } catch (err) {
    console.error('[TTS] Fetch error:', err);
    return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
  }
}
