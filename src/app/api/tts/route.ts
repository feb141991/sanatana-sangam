import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

// Force Node.js runtime — google-auth-library requires it
export const runtime = 'nodejs';

// ── Script detection ──────────────────────────────────────────────────────────
function hasDevanagari(text: string): boolean { return /[ऀ-ॿ]/.test(text); }
function hasGurmukhi(text: string): boolean   { return /[਀-੿]/.test(text); }

// ── Voice Quality Profiles ───────────────────────────────────────────────────
interface VoiceProfile {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE';
  pitch: number;
  rate: number;
}

const PANDIT_PROFILES: Record<string, VoiceProfile> = {
  SANSKRIT_MALE: {
    languageCode: 'hi-IN',
    name: 'hi-IN-Neural2-B', // Deep, resonant male voice
    ssmlGender: 'MALE',
    pitch: -4.0,
    rate: 0.78,
  },
  SANSKRIT_FEMALE: {
    languageCode: 'hi-IN',
    name: 'hi-IN-Neural2-A',
    ssmlGender: 'FEMALE',
    pitch: -1.0,
    rate: 0.82,
  },
  GURMUKHI: {
    languageCode: 'pa-IN',
    name: 'pa-IN-Wavenet-B',
    ssmlGender: 'MALE',
    pitch: -2.0,
    rate: 0.80,
  }
};

function getVoiceConfig(text: string, quality: 'standard' | 'pandit'): VoiceProfile {
  const isPandit = quality === 'pandit';
  
  if (hasDevanagari(text)) {
    return isPandit ? PANDIT_PROFILES.SANSKRIT_MALE : {
      languageCode: 'hi-IN',
      name: 'hi-IN-Standard-D',
      ssmlGender: 'FEMALE',
      pitch: -1.5,
      rate: 0.82
    };
  }
  
  if (hasGurmukhi(text)) {
    return isPandit ? PANDIT_PROFILES.GURMUKHI : {
      languageCode: 'pa-IN',
      name: 'pa-IN-Standard-A',
      ssmlGender: 'FEMALE',
      pitch: 0,
      rate: 0.85
    };
  }

  return {
    languageCode: 'en-IN',
    name: 'en-IN-Wavenet-B',
    ssmlGender: 'MALE',
    pitch: 0,
    rate: 0.90
  };
}

// ── Cached GoogleAuth client ──────────────────────────────────────────────────
let _auth: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (_auth) return _auth;
  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const private_key  = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n');

  if (!client_email || !private_key) {
    throw new Error('Google Cloud TTS Credentials not configured.');
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
  let quality: 'standard' | 'pandit';
  let requestedRate: number | null = null;

  try {
    const body = await req.json();
    text = String(body.text ?? '').trim();
    quality = body.quality === 'pandit' ? 'pandit' : 'standard';
    requestedRate = body.rate ? Number(body.rate) : null;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });

  // Get OAuth2 access token
  let token: string | null | undefined;
  try {
    const auth   = getAuth();
    const client = await auth.getClient();
    const res    = await client.getAccessToken();
    token = res.token;
    if (!token) throw new Error('Empty token returned');
  } catch (err: any) {
    return NextResponse.json({ error: 'TTS auth failed' }, { status: 503 });
  }

  const profile = getVoiceConfig(text, quality);
  
  // For 'Pandit' quality, we use SSML to add meditative pauses
  // Sanskrit verses (Shlokas) usually have a break at the half-verse (।).
  const ssmlText = quality === 'pandit' 
    ? `<speak>${text.replace(/।/g, '। <break time="1200ms"/>').replace(/॥/g, '॥ <break time="2000ms"/>')}</speak>`
    : text;

  const ttsPayload = {
    input: quality === 'pandit' ? { ssml: ssmlText } : { text },
    voice: {
      languageCode: profile.languageCode,
      name: profile.name,
      ssmlGender: profile.ssmlGender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: requestedRate ?? profile.rate,
      pitch: profile.pitch,
      effectsProfileId: ['handset-class-device'], // Adds a bit of resonance
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
      return NextResponse.json({ error: 'TTS upstream error' }, { status: 502 });
    }

    const data = await gRes.json() as { audioContent: string };
    return NextResponse.json({ 
      audioContent: data.audioContent,
      meta: {
        voiceUsed: profile.name,
        qualityUsed: quality
      }
    });

  } catch (err) {
    console.error('[TTS] Fetch error:', err);
    return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
  }
}
