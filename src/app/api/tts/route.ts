import { NextRequest, NextResponse } from 'next/server';

import { generateTTSCacheKey, getCachedAudio, setCachedAudio, fetchFromStorage, uploadToStorage } from '@/lib/tts/cache';
import { synthesizeBhashini } from '@/lib/tts/bhashini';
import { chunkText, mergeAudioChunks } from '@/lib/tts/chunk';
import { preprocessTTS, stripSSMLForPlainTTS } from '@/lib/tts/preprocessing';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, canGenerateTTS, logValidationResult } from '@/lib/ai/validate-pipeline-tags';

export const runtime = 'nodejs';

function hasDevanagari(text: string): boolean { return /[ऀ-ॿ]/.test(text); }
function hasGurmukhi(text: string): boolean { return /[਀-੿]/.test(text); }

function getSarvamVoiceConfig(text: string, quality: 'standard' | 'pandit' | 'akash'): { languageCode: string; speaker: string } {
  if (hasDevanagari(text)) {
    return { languageCode: 'hi-IN', speaker: quality === 'pandit' || quality === 'akash' ? 'shubh' : 'priya' };
  }
  if (hasGurmukhi(text)) {
    return { languageCode: 'pa-IN', speaker: quality === 'pandit' || quality === 'akash' ? 'mani' : 'roopa' };
  }
  return { languageCode: 'en-IN', speaker: quality === 'pandit' || quality === 'akash' ? 'ratan' : 'ishita' };
}

export async function POST(req: NextRequest) {
  let text: string;
  let quality: 'standard' | 'pandit' | 'akash';
  let requestedRate: number | null = null;
  const startTime = Date.now();

  try {
    const body = await req.json();
    text = String(body.text ?? '').trim();
    quality = body.quality === 'pandit'
      ? 'pandit'
      : body.quality === 'akash'
        ? 'akash'
        : 'standard';
    requestedRate = body.rate
      ? Number(body.rate)
      : body.speed
        ? Number(body.speed)
        : null;

    const tagValidation = validatePipelineTags(
      body.pipelineTags ?? body.tags, { context: 'tts_request' }
    );
    if (tagValidation.errors.length > 0) logValidationResult(tagValidation, 'TTS');

    const effectiveTags = mergeTags(tagValidation.tags, getDefaultTags({ text }));
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
  const isDevanagari = hasDevanagari(text);

  const effectiveRate = isDevanagari
    ? 1.0
    : requestedRate ?? 0.75;

  const sarvamProfile = getSarvamVoiceConfig(text, quality);
  const providerLabel = isDevanagari ? 'bhashini'
    : sarvamKey ? 'sarvam'
      : 'sarvam';
  const voiceLabel = isDevanagari ? 'sa-m1' : sarvamProfile.speaker;

  const cacheKey = generateTTSCacheKey(text, providerLabel, voiceLabel, effectiveRate, quality);

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
        text_length: text.length
      }
    });
    return NextResponse.json({
      audioContent: cachedAudio,
      meta: { provider: providerLabel, voiceUsed: voiceLabel, qualityUsed: quality, status: 'cached_memory' }
    });
  }

  cachedAudio = await fetchFromStorage(cacheKey);
  if (cachedAudio) {
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
        text_length: text.length
      }
    });
    return NextResponse.json({
      audioContent: cachedAudio,
      meta: { provider: providerLabel, voiceUsed: voiceLabel, qualityUsed: quality, status: 'cached_storage' }
    });
  }

  const { cleanedText, usesSSML } = preprocessTTS(text, quality);

  if (isDevanagari) {
    let bhashiniFailReason: string | null = null;
    try {
      const style = quality === 'pandit' ? 'Book' : 'Neutral';
      const bhashiniText = usesSSML ? stripSSMLForPlainTTS(cleanedText) : cleanedText;
      const BHASHINI_MAX = 800;
      const bChunks = chunkText(bhashiniText, BHASHINI_MAX);
      const bAudioChunks: string[] = [];
      for (const chunk of bChunks) {
        bAudioChunks.push(await synthesizeBhashini(chunk, style));
      }
      const audioBase64 = mergeAudioChunks(bAudioChunks);
      setCachedAudio(cacheKey, audioBase64);
      await uploadToStorage(cacheKey, audioBase64);
      emitEvent({
        severity: 'P3',
        domain: 'tts',
        route: '/api/tts',
        latency_ms: Date.now() - startTime,
        provider: 'bhashini',
        model: 'sa-m1',
        context: {
          status: 'generated',
          quality,
          text_length: text.length,
          cache_status: 'miss',
          chunks: bChunks.length
        }
      });
      return NextResponse.json({
        audioContent: audioBase64,
        meta: { provider: 'bhashini', voiceUsed: 'sa-m1', qualityUsed: quality, status: 'generated', chunks: bChunks.length }
      });
    } catch (err) {
      bhashiniFailReason = err instanceof Error ? err.message : 'unknown';
      emitError('tts', err, 'P2', { route: '/api/tts', provider: 'bhashini' });
      console.warn('[TTS] Bhashini failed, falling back to Sarvam:', bhashiniFailReason);
    }
  }

  if (!sarvamKey) {
    return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
  }

  const sarvamText = usesSSML ? stripSSMLForPlainTTS(cleanedText) : cleanedText;
  try {
    const SARVAM_MAX = 490;
    const chunks = chunkText(sarvamText, SARVAM_MAX);
    const audioChunks: string[] = [];

    for (const chunk of chunks) {
      const sRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': sarvamKey,
        },
        body: JSON.stringify({
          inputs: [chunk],
          target_language_code: sarvamProfile.languageCode,
          speaker: sarvamProfile.speaker,
          pace: requestedRate ?? 0.75,
          enable_preprocessing: true,
          model: 'bulbul:v3',
        }),
      });

      if (!sRes.ok) {
        const errText = await sRes.text();
        emitError('tts', new Error(`Sarvam ${sRes.status}: ${errText}`), 'P2',
          { route: '/api/tts', provider: 'sarvam' });
        console.error('[TTS] Sarvam chunk error:', sRes.status, errText);
        throw new Error(`Sarvam chunk failed: ${sRes.status}`);
      }

      const data = await sRes.json() as { audios: string[] };
      if (!data.audios?.length) {
        throw new Error('Sarvam returned empty audios');
      }
      audioChunks.push(data.audios[0]);
    }

    const audioBase64 = mergeAudioChunks(audioChunks);
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
        cache_status: 'miss',
        chunks: chunks.length
      }
    });
    return NextResponse.json({
      audioContent: audioBase64,
      meta: { provider: 'sarvam', voiceUsed: sarvamProfile.speaker, qualityUsed: quality, status: 'generated', chunks: chunks.length }
    });
  } catch (err) {
    emitError('tts', err, 'P2', { route: '/api/tts', provider: 'sarvam' });
    console.error('[TTS] Sarvam fetch error:', err);
  }

  return NextResponse.json({ error: 'TTS unavailable' }, { status: 503 });
}
