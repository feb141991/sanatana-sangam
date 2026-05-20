import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { emitEvent } from '@/lib/monitoring/events';

// Interim in-memory cache for TTS audio buffers.
// In a serverless environment (Vercel), this will only persist for the life of the lambda execution.
// However, during local dev and long-running node processes, it will save significant API calls.
// 
// Next step for production: Replace this with Supabase Storage reads/writes.
const _ttsCache = new Map<string, string>();

/**
 * Generates a deterministic cache key for a TTS request.
 */
export function generateTTSCacheKey(
  text: string,
  provider: string,
  voice: string,
  rate: number,
  quality: string
): string {
  const hashInput = `${text.trim()}|${provider}|${voice}|${rate}|${quality}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Retrieves a cached audio string (base64) if it exists.
 */
export function getCachedAudio(key: string): string | null {
  const hit = _ttsCache.get(key) || null;
  if (hit) {
    emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'cache_hit', key } });
  } else {
    emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'cache_miss', key } });
  }
  return hit;
}

/**
 * Saves a generated base64 audio string to the cache.
 */
export function setCachedAudio(key: string, audioBase64: string): void {
  // Prevent runaway memory usage in long-running processes
  if (_ttsCache.size > 1000) {
    const firstKey = _ttsCache.keys().next().value;
    if (firstKey) _ttsCache.delete(firstKey);
  }
  _ttsCache.set(key, audioBase64);
}

// ── Object Storage Prep ────────────────────────────────────────────────────────
// The following functions provide a safe abstraction point to swap from the 
// above in-memory Map cache to a persistent Supabase Storage cache.
// Note: Currently these are defined but not actively blocking the main response path
// to ensure zero disruption before the `shoonaya-tts-cache` bucket is fully configured.

export async function fetchFromStorage(key: string): Promise<string | null> {
  // TODO: Implement actual Supabase fetch once bucket is active.
  // const supabase = createAdminClient();
  // const { data } = await supabase.storage.from('shoonaya-tts-cache').download(`audio/${key}.mp3`);
  // if (data) {
  //   emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'storage_hit', key } });
  //   return streamToBase64(data);
  // }
  
  emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'storage_miss', key } });
  return null; 
}

export async function uploadToStorage(key: string, audioBase64: string): Promise<void> {
  // TODO: Implement actual Supabase upload once bucket is active.
  // Example:
  // const supabase = createAdminClient();
  // const buffer = Buffer.from(audioBase64, 'base64');
  // await supabase.storage.from('shoonaya-tts-cache').upload(`audio/${key}.mp3`, buffer, { contentType: 'audio/mp3' });
}
