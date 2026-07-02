import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type AuditEntry = {
  id: string;
  title: string;
  tradition: string;
  youtubeVideoId: string;
  ok: boolean;
  likelyMatch?: boolean;
  remoteTitle?: string;
  remoteAuthor?: string;
  error?: string;
};

const ROOT = '/Users/Business(C)/Sanatan Sangam/Shoonaya';
const SOURCE = path.join(ROOT, 'src/lib/live-streams.ts');
const OUTPUT = path.join(ROOT, 'tmp/live-stream-audit.json');

async function fetchOEmbed(videoId: string) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${body.slice(0, 140) || res.statusText}`.trim());
  }
  return res.json() as Promise<{ title?: string; author_name?: string }>;
}

function normaliseText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(shri|sri|temple|mandir|live|official|dham|ji|sahib|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelyMatch(localTitle: string, remoteTitle: string, remoteAuthor?: string) {
  const localTokens = new Set(normaliseText(localTitle).split(' ').filter((token) => token.length >= 4));
  const remote = `${remoteTitle} ${remoteAuthor ?? ''}`;
  const remoteNormalised = normaliseText(remote);
  let hits = 0;
  for (const token of localTokens) {
    if (remoteNormalised.includes(token)) hits += 1;
  }
  return hits >= Math.min(2, localTokens.size);
}

function extractLiveStreamsSection(source: string) {
  const marker = 'export const LIVE_STREAMS: LiveStream[] = [';
  const start = source.indexOf(marker);
  if (start < 0) return source;
  let index = start + marker.length;
  let depth = 1;
  for (; index < source.length; index++) {
    const ch = source[index];
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start + marker.length, index);
      }
    }
  }
  return source;
}

function parseEntries(source: string) {
  const entries: Array<{ id: string; title: string; tradition: string; youtubeVideoId: string }> = [];
  const scoped = extractLiveStreamsSection(source);
  const pattern =
    /id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?tradition:\s*'([^']+)'[\s\S]*?youtubeVideoId:\s*'([^']+)'/g;

  for (const match of scoped.matchAll(pattern)) {
    entries.push({
      id: match[1],
      title: match[2],
      tradition: match[3],
      youtubeVideoId: match[4],
    });
  }

  return entries;
}

async function main() {
  const source = await readFile(SOURCE, 'utf8');
  const entries = parseEntries(source);
  const results: AuditEntry[] = [];
  await mkdir(path.dirname(OUTPUT), { recursive: true });

  for (const entry of entries) {
    try {
      const data = await fetchOEmbed(entry.youtubeVideoId);
      results.push({
        ...entry,
        ok: true,
        likelyMatch: isLikelyMatch(entry.title, data.title ?? '', data.author_name),
        remoteTitle: data.title,
        remoteAuthor: data.author_name,
      });
    } catch (error) {
      results.push({
        ...entry,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  await writeFile(OUTPUT, JSON.stringify(results, null, 2), 'utf8');

  const ok = results.filter((entry) => entry.ok);
  const trusted = ok.filter((entry) => entry.likelyMatch);
  const mismatched = ok.filter((entry) => !entry.likelyMatch);
  const bad = results.filter((entry) => !entry.ok);

  console.log(`Audited ${results.length} live stream IDs`);
  console.log(`Resolvable: ${ok.length}`);
  console.log(`Likely match: ${trusted.length}`);
  console.log(`Resolvable but mismatched: ${mismatched.length}`);
  console.log(`Failed: ${bad.length}`);
  console.log(`Wrote: ${OUTPUT}`);
}

void main();
