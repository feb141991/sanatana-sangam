import crypto from 'crypto';

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
  return _ttsCache.get(key) || null;
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
