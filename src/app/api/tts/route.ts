import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { generateTTSCacheKey, getCachedAudio, setCachedAudio, fetchFromStorage, uploadToStorage } from '@/lib/tts/cache';
import { preprocessTTS } from '@/lib/tts/preprocessing';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, resolveScript, canGenerateTTS, logValidationResult } from '@/lib/ai/validate-pipeline-tags';

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

function getVoiceConfig(text: string, quality: 'standard' | 'pandit' | 'akash'): VoiceProfile {
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

function getSarvamVoiceConfig(text: string, quality: 'standard' | 'pandit' | 'akash'): { languageCode: string, speaker: string } {
  if (hasDevanagari(text)) {
    return { languageCode: 'hi-IN', speaker: quality === 'pandit' || quality === 'akash' ? 'shubh' : 'priya' };
  }
  if (hasGurmukhi(text)) {
    return { languageCode: 'pa-IN', speaker: quality === 'pandit' || quality === 'akash' ? 'mani' : 'roopa' };
  }
  return { languageCode: 'en-IN', speaker: quality === 'pandit' || quality === 'akash' ? 'ratan' : 'ishita' };
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
  let quality: 'standard' | 'pandit' | 'akash';
  let requestedRate: number | null = null;
  const startTime = Date.now();

  try {
    const body = await req.json();
    text = String(body.text ?? '').trim();
    quality = body.quality === 'pandit' ? 'pandit' : (body.quality === 'akash' ? 'akash' : 'standard');
    requestedRate = body.rate ? Number(body.rate) : null;

    // Validate and normalize incoming pipeline tags
    const tagValidation = validatePipelineTags(body.pipelineTags ?? body.tags, { context: 'tts_request' });
    logValidationResult(tagValidation, 'TTS');
    const providedTags = tagValidation.tags;

    // Merge with defaults
    const defaultTags = getDefaultTags({ text });
    const effectiveTags = mergeTags(providedTags, defaultTags);

    // Check if TTS is allowed based on audio_mode
    if (!canGenerateTTS(effectiveTags.audio_mode)) {
      return NextResponse.json(
        { error: `TTS not allowed for audio_mode: ${effectiveTags.audio_mode}` },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });

  const sarvamKey = process.env.SARVAM_API_KEY?.trim();
  const providerLabel = sarvamKey ? 'sarvam' : 'google';
  const effectiveProfileName = sarvamKey ? getSarvamVoiceConfig(text, quality).speaker : getVoiceConfig(text, quality).name;
  const effectiveRate = requestedRate ?? (sarvamKey ? 1.0 : getVoiceConfig(text, quality).rate);

  const cacheKey = generateTTSCacheKey(text, providerLabel, effectiveProfileName, effectiveRate, quality);
  
  // ── Cache lookup: Memory → Storage → Generate ──────────────────────────────────
  let cachedAudio = getCachedAudio(cacheKey);
  if (cachedAudio) {
    emitEvent({ 
      severity: 'P3', 
      domain: 'tts', 
      route: '/api/tts', 
      latency_ms: Date.now() - startTime,
      context: { 
        status: 'memory_cache',
        quality,
        provider: providerLabel,
        text_length: text.length,
      } 
    });
    return NextResponse.json({
      audioContent: cachedAudio,
      meta: {
        provider: providerLabel,
        voiceUsed: effectiveProfileName,
        qualityUsed: quality,
        status: 'cached_memory'
      }
    });
  }
  
  // Try durable storage
  cachedAudio = await fetchFromStorage(cacheKey);
  if (cachedAudio) {
    // Populate memory cache for subsequent requests
    setCachedAudio(cacheKey, cachedAudio);
    emitEvent({ 
      severity: 'P3', 
      domain: 'tts', 
      route: '/api/tts', 
      latency_ms: Date.now() - startTime,
      context: { 
        status: 'storage_cache',
        quality,
        provider: providerLabel,
        text_length: text.length,
      } 
    });
    return NextResponse.json({
      audioContent: cachedAudio,
      meta: {
        provider: providerLabel,
        voiceUsed: effectiveProfileName,
        qualityUsed: quality,
        status: 'cached_storage'
      }
    });
  }

  const { cleanedText, usesSSML } = preprocessTTS(text, quality);

  if (sarvamKey) {
    const sarvamProfile = getSarvamVoiceConfig(text, quality);
    try {
      const sRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': sarvamKey,
        },
        body: JSON.stringify({
          inputs: [cleanedText],
          target_language_code: sarvamProfile.languageCode,
          speaker: sarvamProfile.speaker,
          pace: requestedRate ?? 1.0,
          enable_preprocessing: true,
          model: 'bulbul:v3'
        }),
      });

      if (sRes.ok) {
        const data = await sRes.json() as { audios: string[] };
        if (data.audios && data.audios.length > 0) {
          const audioBase64 = data.audios[0];
          setCachedAudio(cacheKey, audioBase64);
          await uploadToStorage(cacheKey, audioBase64);
          
          emitEvent({
            severity: 'P3',
            domain: 'tts',
            route: '/api/tts',
            latency_ms: Date.now() - startTime,
            provider: 'sarvam',
            model: 'bulbul:v3',
            context: {
              status: 'generated',
              quality,
              text_length: text.length,
              cache_status: 'miss'
            }
          });

          return NextResponse.json({
            audioContent: audioBase64,
            meta: {
              provider: 'sarvam',
              voiceUsed: sarvamProfile.speaker,
              qualityUsed: quality,
              status: 'generated'
            }
          });
        }
      } else {
        const errText = await sRes.text();
        emitError('tts', new Error(`Sarvam API error: ${errText}`), 'P2', { route: '/api/tts', provider: 'sarvam' });
        console.error('[TTS] Sarvam API error:', sRes.status, errText);
      }
    } catch (err) {
      emitError('tts', err, 'P2', { route: '/api/tts', provider: 'sarvam' });
      console.error('[TTS] Sarvam fetch error:', err);
    }
  }

  // Fallback to Google TTS
  // Get OAuth2 access token
  let token: string | null | undefined;
  try {
    const auth   = getAuth();
    const client = await auth.getClient();
    const res    = await client.getAccessToken();
    token = res.token;
    if (!token) throw new Error('Empty token returned');
  } catch (err: any) {
    emitError('tts', err, 'P1', { route: '/api/tts', provider: 'google', error_message: 'TTS auth failed' });
    return NextResponse.json({ error: 'TTS auth failed' }, { status: 503 });
  }

  const profile = getVoiceConfig(text, quality);
  
  // Google TTS SSML handling is now partially driven by preprocessing.
  const ttsPayloadText = usesSSML ? { ssml: cleanedText } : { text: cleanedText };

  const ttsPayload = {
    input: ttsPayloadText,
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
      emitError('tts', new Error(`Google API error: ${errText}`), 'P1', { route: '/api/tts', provider: 'google' });
      console.error('[TTS] Google API error:', gRes.status, errText);
      return NextResponse.json({ error: 'TTS upstream error' }, { status: 502 });
    }

    const data = await gRes.json() as { audioContent: string };
    setCachedAudio(cacheKey, data.audioContent);
    await uploadToStorage(cacheKey, data.audioContent);
    
    emitEvent({
      severity: 'P3',
      domain: 'tts',
      route: '/api/tts',
      latency_ms: Date.now() - startTime,
      provider: 'google',
      model: profile.name,
      context: {
        status: 'generated',
        quality,
        text_length: text.length,
        cache_status: 'miss',
        fallback_used: !!sarvamKey
      }
    });

    return NextResponse.json({ 
      audioContent: data.audioContent,
      meta: {
        provider: 'google',
        voiceUsed: profile.name,
        qualityUsed: quality,
        status: 'generated'
      }
    });

  } catch (err) {
    emitError('tts', err, 'P1', { route: '/api/tts', provider: 'google' });
    console.error('[TTS] Fetch error:', err);
    return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
  }
}
