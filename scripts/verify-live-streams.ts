import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type AuditEntry = {
  id: string;
  title: string;
  tradition: string;
  youtubeVideoId: string;
  ok: boolean;
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

function parseEntries(source: string) {
  const entries: Array<{ id: string; title: string; tradition: string; youtubeVideoId: string }> = [];
  const pattern =
    /id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?tradition:\s*'([^']+)'[\s\S]*?youtubeVideoId:\s*'([^']+)'/g;

  for (const match of source.matchAll(pattern)) {
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
  const bad = results.filter((entry) => !entry.ok);

  console.log(`Audited ${results.length} live stream IDs`);
  console.log(`Verified: ${ok.length}`);
  console.log(`Failed: ${bad.length}`);
  console.log(`Wrote: ${OUTPUT}`);
}

void main();
