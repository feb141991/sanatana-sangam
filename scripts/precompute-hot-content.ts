/**
 * Precompute hot content for TTS and explanation cache.
 * 
 * Usage:
 *   npx tsx scripts/precompute-hot-content.ts [--domain] [--limit] [--dry-run]
 * 
 * Examples:
 *   npx tsx scripts/precompute-hot-content.ts --domain bhakti --limit 10
 *   npx tsx scripts/precompute-hot-content.ts --domain pathshala --dry-run
 *   npx tsx scripts/precompute-hot-content.ts
 * 
 * Domains: bhakti, pathshala, vrat, all (default)
 * Default limit: 20 items per domain
 */

import { HINDU_KATHAS, SIKH_SAKHIS } from '@/lib/katha-library';
import type { Katha } from '@/lib/katha-library';
import { STOTRAMS } from '@/lib/stotrams';
import type { Stotram } from '@/lib/stotrams';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';
import type { LibraryEntry } from '@/lib/library-content';

interface PrecomputeItem {
  id: string;
  type: 'katha' | 'stotram' | 'verse' | 'scripture';
  domain: 'bhakti' | 'pathshala' | 'vrat';
  title: string;
  content?: string;
  language?: string;
  tradition?: string;
  needsTTS?: boolean;
  needsExplanation?: boolean;
}

interface PrecomputeOptions {
  domain?: 'bhakti' | 'pathshala' | 'vrat' | 'all';
  limit?: number;
  dryRun?: boolean;
  verbose?: boolean;
}

// Parse CLI arguments
function parseArgs(): PrecomputeOptions {
  const args = process.argv.slice(2);
  const opts: PrecomputeOptions = { limit: 20, dryRun: false, verbose: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) {
      opts.domain = args[++i] as any;
    } else if (args[i] === '--limit' && args[i + 1]) {
      opts.limit = parseInt(args[++i], 10);
    } else if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--verbose') {
      opts.verbose = true;
    }
  }

  return opts;
}

// Collect Bhakti kathas
function getBhaktiContent(limit: number): PrecomputeItem[] {
  const items: PrecomputeItem[] = [];

  // Add top kathas (Hindu first, then Sikh)
  const allKathas = [...HINDU_KATHAS, ...SIKH_SAKHIS];
  for (let i = 0; i < Math.min(limit / 2, allKathas.length); i++) {
    const katha = allKathas[i];

    items.push({
      id: katha.id,
      type: 'katha',
      domain: 'bhakti',
      title: katha.title,
      content: katha.preview,
      language: 'en',
      tradition: katha.tradition,
      needsTTS: false, // Kathas have recorded narration
      needsExplanation: true, // Katha previews benefit from explanation
    });
  }

  // Add stotrams
  const stotrams = STOTRAMS.slice(0, Math.min(limit / 2, STOTRAMS.length));
  for (const stotram of stotrams) {
    items.push({
      id: stotram.id,
      type: 'stotram',
      domain: 'bhakti',
      title: stotram.title,
      content: stotram.description,
      language: stotram.language ?? 'en',
      tradition: stotram.tradition,
      needsTTS: Boolean(stotram.audioTrackId === undefined), // Generate TTS if no pre-recorded
      needsExplanation: true,
    });
  }

  return items.slice(0, limit);
}

// Collect Pathshala scripture
function getPathshalaContent(limit: number): PrecomputeItem[] {
  const items: PrecomputeItem[] = [];

  // Add verses/scriptures
  const entries = ALL_LIBRARY_ENTRIES.slice(0, Math.min(limit, ALL_LIBRARY_ENTRIES.length));
  for (const entry of entries) {
    items.push({
      id: entry.id,
      type: 'scripture',
      domain: 'pathshala',
      title: entry.title,
      content: entry.fullText || entry.original || entry.meaning,
      language: 'en',
      tradition: entry.tradition,
      needsTTS: true, // Verse recitation benefits from TTS
      needsExplanation: true, // All scriptures benefit from explanation
    });
  }

  return items;
}

// Collect Vrat content (if available)
function getVratContent(limit: number): PrecomputeItem[] {
  // Vrat content would come from a vrat-library or similar
  // For now, return empty; can be populated when vrat data structure is available
  return [];
}

// Fetch or generate TTS for a content item
async function generateTTS(item: PrecomputeItem, dryRun: boolean): Promise<{ cached: boolean; cacheKey?: string }> {
  if (!item.needsTTS || !item.content) {
    return { cached: false };
  }

  const cacheKey = `v1/audio/${item.domain}/${item.type}/${item.id}/en`;

  if (dryRun) {
    console.log(`  [DRY-RUN] TTS: ${item.title} → ${cacheKey}`);
    return { cached: true, cacheKey };
  }

  try {
    // Call the TTS API to generate and cache
    const response = await fetch('http://localhost:3000/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: item.content,
        language: item.language || 'en',
        tags: {
          content_type: item.type === 'stotram' ? 'stotram' : item.type === 'katha' ? 'katha' : 'sacred_verse',
          audio_mode: item.type === 'katha' ? 'story' : 'standard',
          tradition: item.tradition === 'all' ? 'generic' : item.tradition,
          delivery_intent: 'background_precompute',
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✓ TTS generated: ${item.title}`);
      return { cached: true, cacheKey };
    } else {
      console.error(`  ✗ TTS failed: ${item.title} (${response.status})`);
      return { cached: false, cacheKey };
    }
  } catch (e: any) {
    console.error(`  ✗ TTS error: ${item.title} (${e.message})`);
    return { cached: false, cacheKey };
  }
}

// Fetch or generate explanation for a content item
async function generateExplanation(item: PrecomputeItem, dryRun: boolean): Promise<{ cached: boolean; cacheKey?: string }> {
  if (!item.needsExplanation || !item.content) {
    return { cached: false };
  }

  const cacheKey = `pathshala_explain:${item.domain}:${item.type}:${item.id}:conversational:${item.language || 'en'}:${item.tradition}`;

  if (dryRun) {
    console.log(`  [DRY-RUN] Explain: ${item.title} → ${cacheKey}`);
    return { cached: true, cacheKey };
  }

  try {
    // Call the explain API to generate and cache
    const response = await fetch('http://localhost:3000/api/pathshala/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalText: item.content,
        responseMode: 'conversational',
        language: item.language || 'en',
        tradition: item.tradition === 'all' ? 'generic' : item.tradition,
        tags: {
          content_type: item.type === 'katha' ? 'katha' : item.type === 'stotram' ? 'stotram' : 'sacred_verse',
          response_mode: 'conversational',
          tradition: item.tradition === 'all' ? 'generic' : item.tradition,
          delivery_intent: 'background_precompute',
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✓ Explanation generated: ${item.title}`);
      return { cached: true, cacheKey };
    } else {
      console.error(`  ✗ Explanation failed: ${item.title} (${response.status})`);
      return { cached: false, cacheKey };
    }
  } catch (e: any) {
    console.error(`  ✗ Explanation error: ${item.title} (${e.message})`);
    return { cached: false, cacheKey };
  }
}

// Main precompute flow
async function precomputeContent(opts: PrecomputeOptions): Promise<void> {
  console.log(`\n📦 Precompute Hot Content`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (opts.dryRun) console.log(`[DRY-RUN MODE]\n`);

  let items: PrecomputeItem[] = [];
  const domains = opts.domain === 'all' ? ['bhakti', 'pathshala', 'vrat'] : [opts.domain || 'bhakti'];
  const limit = opts.limit || 20;

  // Collect items by domain
  for (const domain of domains) {
    if (domain === 'bhakti') {
      console.log(`\n🕉️  Bhakti (limit: ${limit})`);
      const bhaktiItems = getBhaktiContent(limit);
      console.log(`   Found ${bhaktiItems.length} kathas/stotrams`);
      items.push(...bhaktiItems);
    } else if (domain === 'pathshala') {
      console.log(`\n📚 Pathshala (limit: ${limit})`);
      const pathshalaItems = getPathshalaContent(limit);
      console.log(`   Found ${pathshalaItems.length} scriptures`);
      items.push(...pathshalaItems);
    } else if (domain === 'vrat') {
      console.log(`\n🙏 Vrat (limit: ${limit})`);
      const vratItems = getVratContent(limit);
      console.log(`   Found ${vratItems.length} vrat items`);
      items.push(...vratItems);
    }
  }

  if (items.length === 0) {
    console.log(`\n⚠️  No content found. Exiting.`);
    return;
  }

  console.log(`\n📤 Precomputing ${items.length} items...`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let ttsCacheCount = 0;
  let explainCacheCount = 0;

  for (const item of items) {
    console.log(`${item.type.toUpperCase()} | ${item.title}`);

    if (item.needsTTS) {
      const ttsResult = await generateTTS(item, opts.dryRun ?? false);
      if (ttsResult.cached) ttsCacheCount++;
    }

    if (item.needsExplanation) {
      const explainResult = await generateExplanation(item, opts.dryRun ?? false);
      if (explainResult.cached) explainCacheCount++;
    }

    // Delay to avoid rate limiting
    if (!opts.dryRun) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Precompute Complete`);
  console.log(`   TTS cache entries: ${ttsCacheCount}`);
  console.log(`   Explanation cache entries: ${explainCacheCount}`);
  console.log(`   Total cache entries: ${ttsCacheCount + explainCacheCount}\n`);

  if (opts.dryRun) {
    console.log(`💡 Run again without --dry-run to actually precompute.\n`);
  }
}

// Entry point
const opts = parseArgs();
precomputeContent(opts).catch(e => {
  console.error('❌ Precompute failed:', e);
  process.exit(1);
});
