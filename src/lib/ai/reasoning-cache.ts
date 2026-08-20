import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { emitEvent } from '@/lib/monitoring/events';
import type { PathshalaExplainInput } from '@/lib/ai/contracts';

/**
 * Persistent cache for stable reasoning outputs (explanations, generations).
 * Stores to Supabase to survive restarts and scale across instances.
 */

const BUCKET_NAME = 'shoonaya-reasoning-cache';
const CACHE_VERSION = '1'; // Bump to invalidate all cache keys
const L1_CACHE_MAX_SIZE = 500;

// Bounded in-memory L1 cache with LRU eviction
const l1Cache = new Map<string, Record<string, any>>();

function getL1Key(task: string, key: string): string {
  return `v${CACHE_VERSION}:${task}:${key}`;
}

function getFromL1(task: string, key: string): Record<string, any> | null {
  const l1Key = getL1Key(task, key);
  if (!l1Cache.has(l1Key)) return null;
  const value = l1Cache.get(l1Key)!;
  // Move to end (most recently used)
  l1Cache.delete(l1Key);
  l1Cache.set(l1Key, value);
  return value;
}

function setToL1(task: string, key: string, value: Record<string, any>): void {
  const l1Key = getL1Key(task, key);
  if (l1Cache.has(l1Key)) {
    l1Cache.delete(l1Key);
  } else if (l1Cache.size >= L1_CACHE_MAX_SIZE) {
    const oldestKey = l1Cache.keys().next().value;
    if (oldestKey !== undefined) {
      l1Cache.delete(oldestKey);
    }
  }
  l1Cache.set(l1Key, value);
}

/**
 * Generate a stable cache key for a reasoning task.
 * Includes: source, response_mode, language, tradition, content hash.
 */
export function generateReasoningCacheKey(
  task: 'pathshala_explain' | 'meaning_generate',
  input: Record<string, any>
): string {
  // Normalize input for deterministic hashing
  const normalized = {
    task,
    entryId: input.entryId || '',
    source: input.source || '',
    title: input.title || '',
    sourceLabel: input.sourceLabel || '',
    sourceMeaning: input.sourceMeaning || '',
    originalText: input.originalText || input.text || '',
    responseMode: input.responseMode || '',
    language: input.language || input.targetLanguage || 'en',
    tradition: input.tradition || '',
  };

  const hashInput = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

function getStoragePath(task: string, key: string): string {
  return `v${CACHE_VERSION}/${task}/${key}.json`;
}

/**
 * Fetch cached reasoning output from L1 memory or L2 Supabase Storage.
 */
export async function fetchReasoningCache(
  task: string,
  key: string
): Promise<Record<string, any> | null> {
  const l1Result = getFromL1(task, key);
  if (l1Result) {
    emitEvent({
      severity: 'P3',
      domain: 'ai',
      context: { action: 'reasoning_cache_hit_l1', task, key },
    });
    return l1Result;
  }

  try {
    const supabase = createAdminClient();
    const path = getStoragePath(task, key);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) {
      emitEvent({
        severity: 'P3',
        domain: 'ai',
        context: { action: 'reasoning_cache_miss', task, key, reason: error.message },
      });
      return null;
    }

    if (!data) {
      emitEvent({
        severity: 'P3',
        domain: 'ai',
        context: { action: 'reasoning_cache_miss', task, key, reason: 'no_data' },
      });
      return null;
    }

    const text = await data.text();
    const cached = JSON.parse(text);
    setToL1(task, key, cached);
    emitEvent({
      severity: 'P3',
      domain: 'ai',
      context: { action: 'reasoning_cache_hit_l2', task, key },
    });
    return cached;
  } catch (err) {
    emitEvent({
      severity: 'P3',
      domain: 'ai',
      context: { action: 'reasoning_cache_error', task, key, error: String(err) },
    });
    return null;
  }
}

/**
 * Store reasoning output to persistent cache.
 */
export async function storeReasoningCache(
  task: string,
  key: string,
  output: Record<string, any>
): Promise<void> {
  // Populate L1 cache immediately so same-process subsequent reads hit memory in 0ms
  setToL1(task, key, output);

  try {
    const supabase = createAdminClient();
    const path = getStoragePath(task, key);
    const jsonContent = JSON.stringify(output, null, 2);
    const buffer = Buffer.from(jsonContent, 'utf-8');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: 'application/json',
        cacheControl: '31536000', // 1 year (immutable)
      });

    if (error) {
      emitEvent({
        severity: 'P2',
        domain: 'ai',
        context: { action: 'reasoning_cache_store_error', task, key, error: error.message },
      });
      return;
    }

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      context: { action: 'reasoning_cache_stored', task, key },
    });
  } catch (err) {
    emitEvent({
      severity: 'P2',
      domain: 'ai',
      context: { action: 'reasoning_cache_store_exception', task, key, error: String(err) },
    });
  }
}

/**
 * Cache wrapper for reasoning tasks.
 * Returns cached result if available, otherwise calls generator and caches output.
 */
export async function withReasoningCache<T extends Record<string, any>>(
  task: string,
  input: Record<string, any>,
  generator: () => Promise<T>
): Promise<T & { _cached?: boolean }> {
  const cacheKey = generateReasoningCacheKey(task as any, input);

  // Try to fetch from cache
  const cached = await fetchReasoningCache(task, cacheKey);
  if (cached) {
    return { ...cached, _cached: true } as T & { _cached: boolean };
  }

  // Generate fresh output
  const fresh = await generator();

  // Store to cache (non-blocking)
  storeReasoningCache(task, cacheKey, fresh).catch(() => {
    // Silently fail cache storage; generation succeeded
  });

  return { ...fresh, _cached: false } as T & { _cached: boolean };
}
