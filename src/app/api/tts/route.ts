import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

// Force Node.js runtime — google-auth-library requires it
export const runtime = 'nodejs';

// ── Script detection ──────────────────────────────────────────────────────────
function hasDevanagari(text: string): boolean { return /[ऀ-ॿ]/.test(text); }
function hasGurmukhi(text: string): boolean   { return /[਀-੿]/.test(text); }

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

function pickVoice(text: string): VoiceConfig {
  if (hasDevanagari(text))
    return { languageCode: 'sa-IN', name: 'sa-IN-Standard-A', ssmlGender: 'FEMALE' };
  if (hasGurmukhi(text))
    return { languageCode: 'pa-IN', name: 'pa-IN-Standard-A', ssmlGender: 'FEMALE' };
  return { languageCode: 'en-IN', name: 'en-IN-Standard-A', ssmlGender: 'FEMALE' };
}

// ── Cached GoogleAuth client ──────────────────────────────────────────────────
let _auth: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (_auth) return _auth;
  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const private_key  = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n');

  if (!client_email || !private_key) {
    throw new Error('Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  _auth = new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  return _auth;
}

// ── POST /api/tts ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let text: string;
  let rate: number;

  try {
    const body = await req.json();
    text = String(body.text ?? '').trim();
    rate = Number(body.rate ?? 0.82);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });
  rate = Math.max(0.25, Math.min(4.0, rate));

  // Get OAuth2 access token
  let token: string | null | undefined;
  try {
    const auth   = getAuth();
    const client = await auth.getClient();
    const res    = await client.getAccessToken();
    token = res.token;
    if (!token) throw new Error('Empty token returned');
  } catch (err: any) {
    console.error('[TTS] Auth error:', err?.message);
    return NextResponse.json({ error: 'TTS auth failed', detail: err?.message }, { status: 503 });
  }

  const ttsPayload = {
    input: { text },
    voice: pickVoice(text),
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: rate,
      pitch: -1.5,
      effectsProfileId: [],
    },
  };

  try {
    const gRes = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(ttsPayload),
    });

    if (!gRes.ok) {
      const errText = await gRes.text();
      console.error('[TTS] Google API error:', gRes.status, errText);
      return NextResponse.json({ error: 'TTS upstream error', detail: gRes.status }, { status: 502 });
    }

    const data = await gRes.json() as { audioContent: string };
    return NextResponse.json({ audioContent: data.audioContent });

  } catch (err) {
    console.error('[TTS] Fetch error:', err);
    return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
  }
}
