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

// ── Object Storage (Durable Cache via Supabase Storage) ──────────────────────
// The following functions implement persistent cache reads/writes to Supabase Storage.
// This ensures TTS audio persists across serverless restarts and instance scaling.

const BUCKET_NAME = 'shoonaya-tts-cache';
const CACHE_VERSION = '1'; // Bump this to invalidate all old cache keys

function getStoragePath(key: string): string {
  return `v${CACHE_VERSION}/audio/${key}.mp3`;
}

/**
 * Helper: Convert Uint8Array (or Blob data) to base64 string.
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  return Buffer.from(bytes).toString('base64');
}

/**
 * Fetch audio from Supabase Storage. Returns base64 if found.
 */
export async function fetchFromStorage(key: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const path = getStoragePath(key);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);
    
    if (error) {
      emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'storage_miss', key, reason: error.message } });
      return null;
    }
    
    if (!data) {
      emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'storage_miss', key, reason: 'no_data' } });
      return null;
    }
    
    const buffer = await data.arrayBuffer();
    const audioBase64 = bufferToBase64(buffer);
    emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'storage_hit', key } });
    return audioBase64;
  } catch (err) {
    emitEvent({ 
      severity: 'P3', 
      domain: 'tts', 
      context: { action: 'storage_error', key, error: String(err) } 
    });
    return null;
  }
}

/**
 * Upload audio to Supabase Storage. Receives base64, converts to buffer.
 */
export async function uploadToStorage(key: string, audioBase64: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const path = getStoragePath(key);
    
    // Convert base64 to buffer
    const buffer = Buffer.from(audioBase64, 'base64');
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, { 
        contentType: 'audio/mpeg',
        cacheControl: '31536000' // 1 year (immutable content)
      });
    
    if (error) {
      emitEvent({ 
        severity: 'P2', 
        domain: 'tts', 
        context: { action: 'storage_upload_error', key, error: error.message } 
      });
      return;
    }
    
    emitEvent({ severity: 'P3', domain: 'tts', context: { action: 'storage_upload', key } });
  } catch (err) {
    emitEvent({ 
      severity: 'P2', 
      domain: 'tts', 
      context: { action: 'storage_upload_exception', key, error: String(err) } 
    });
  }
}
