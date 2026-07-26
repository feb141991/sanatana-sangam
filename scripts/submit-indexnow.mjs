import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ORIGIN = 'https://www.shoonaya.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10_000;

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

export function parseSitemap(xml, siteOrigin = DEFAULT_ORIGIN) {
  const canonicalOrigin = new URL(siteOrigin).origin;
  const entries = new Map();

  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/giu)) {
    const block = match[1];
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/iu)?.[1]?.trim();
    if (!loc) continue;

    let url;
    try {
      url = new URL(decodeXml(loc));
    } catch {
      continue;
    }

    if (url.origin !== canonicalOrigin) continue;
    url.hash = '';

    const lastModified = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/iu)?.[1]?.trim() ?? null;
    entries.set(url.href, lastModified);
  }

  return entries;
}

function routePatternFromAppFile(file) {
  if (!file.startsWith('src/app/') || file.includes('/api/')) return null;

  const relative = file.slice('src/app/'.length);
  const segments = relative.split('/');
  const fileName = segments.at(-1) ?? '';
  if (!/\.(?:js|jsx|ts|tsx|md|mdx)$/u.test(fileName)) return null;
  if (/^(?:route|sitemap|robots|manifest|opengraph-image|twitter-image)\./u.test(fileName)) return null;

  const routeSegments = segments
    .slice(0, -1)
    .filter(segment => !segment.startsWith('(') && !segment.startsWith('@'))
    .map(segment => {
      if (/^\[\[\.\.\..+\]\]$/u.test(segment) || /^\[\.\.\..+\]$/u.test(segment)) return '**';
      if (/^\[.+\]$/u.test(segment)) return '*';
      return segment;
    });

  return {
    path: `/${routeSegments.join('/')}`,
    includeDescendants: /^(?:layout|template)\./u.test(fileName),
  };
}

function matchesRoute(url, routePattern, siteOrigin = DEFAULT_ORIGIN) {
  const pathname = new URL(url).pathname;
  if (routePattern.path === '/') {
    return routePattern.includeDescendants || pathname === '/';
  }

  const routeParts = routePattern.path.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  for (let index = 0; index < routeParts.length; index += 1) {
    const routePart = routeParts[index];
    if (routePart === '**') return true;
    if (pathParts[index] === undefined) return false;
    if (routePart !== '*' && routePart !== pathParts[index]) return false;
  }

  return routePattern.includeDescendants || pathParts.length === routeParts.length;
}

export function inferUpdatedUrls(changedFiles, currentUrls, previousUrls, siteOrigin = DEFAULT_ORIGIN) {
  const allUrls = new Set([...currentUrls, ...previousUrls]);
  const selected = new Set();
  let submitAll = false;

  const selectPrefix = prefix => {
    for (const url of allUrls) {
      if (new URL(url).pathname.startsWith(prefix)) selected.add(url);
    }
  };

  for (const file of changedFiles) {
    if (
      file.startsWith('src/components/') ||
      file.startsWith('src/contexts/') ||
      file === 'src/app/layout.tsx' ||
      file === 'src/app/globals.css' ||
      file === 'next.config.js' ||
      file === 'middleware.ts'
    ) {
      submitAll = true;
      continue;
    }

    if (file === 'public/landing.html') {
      selected.add(`${siteOrigin}/`);
      continue;
    }

    if (file.startsWith('src/lib/vrat-data')) {
      selectPrefix('/vrat/');
      continue;
    }

    if (file.startsWith('src/lib/stotrams')) {
      selectPrefix('/bhakti/stotram/');
      continue;
    }

    if (file.startsWith('src/lib/katha')) {
      selectPrefix('/bhakti/katha/');
      continue;
    }

    const routePattern = routePatternFromAppFile(file);
    if (routePattern !== null) {
      for (const url of allUrls) {
        if (matchesRoute(url, routePattern, siteOrigin)) selected.add(url);
      }
    }
  }

  return submitAll ? allUrls : selected;
}

function changedFilesBetween(previousSha, currentSha) {
  if (!previousSha || !currentSha || previousSha === currentSha) return [];

  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-only', `${previousSha}..${currentSha}`, '--'],
      { encoding: 'utf8' },
    );
    return output.split('\n').map(file => file.trim()).filter(Boolean);
  } catch (error) {
    console.warn(`Could not inspect changed files: ${error.message}`);
    return [];
  }
}

async function readSnapshot(snapshotPath) {
  try {
    const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
    return {
      deploymentSha: typeof snapshot.deploymentSha === 'string' ? snapshot.deploymentSha : null,
      entries: new Map(Array.isArray(snapshot.entries) ? snapshot.entries : []),
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') console.warn(`Ignoring invalid IndexNow snapshot: ${error.message}`);
    return { deploymentSha: null, entries: new Map() };
  }
}

async function writeSnapshot(snapshotPath, deploymentSha, entries) {
  await mkdir(dirname(snapshotPath), { recursive: true });
  await writeFile(
    snapshotPath,
    `${JSON.stringify({
      deploymentSha: deploymentSha || null,
      generatedAt: new Date().toISOString(),
      entries: [...entries.entries()].sort(([left], [right]) => left.localeCompare(right)),
    }, null, 2)}\n`,
  );
}

async function appendSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

export async function run({
  fetchImpl = fetch,
  siteOrigin = process.env.SITE_ORIGIN || DEFAULT_ORIGIN,
  snapshotPath = resolve(process.env.INDEXNOW_SNAPSHOT_PATH || '.indexnow/sitemap.json'),
  deploymentSha = process.env.DEPLOYMENT_SHA || process.env.GITHUB_SHA || null,
  forceSubmit = process.env.INDEXNOW_FORCE_SUBMIT === 'true',
  dryRun = process.env.INDEXNOW_DRY_RUN === 'true',
} = {}) {
  const origin = new URL(siteOrigin).origin;
  const keyFilePath = resolve(
    process.env.INDEXNOW_KEY_FILE || 'public/ecb13bc18920487faed9fce877b7c386.txt',
  );
  const key = (await readFile(keyFilePath, 'utf8')).trim();
  const keyLocation = `${origin}/${key}.txt`;
  const sitemapUrl = `${origin}/sitemap.xml`;
  const previous = await readSnapshot(snapshotPath);

  const sitemapResponse = await fetchImpl(sitemapUrl, {
    headers: { 'user-agent': 'Shoonaya-IndexNow/1.0' },
  });
  if (!sitemapResponse.ok) {
    throw new Error(`Could not fetch sitemap (${sitemapResponse.status} ${sitemapResponse.statusText})`);
  }

  const currentEntries = parseSitemap(await sitemapResponse.text(), origin);
  if (currentEntries.size === 0) throw new Error('The live sitemap did not contain canonical URLs');

  const currentUrls = new Set(currentEntries.keys());
  const previousUrls = new Set(previous.entries.keys());
  const selected = new Set();

  for (const url of currentUrls) {
    if (!previous.entries.has(url) || previous.entries.get(url) !== currentEntries.get(url)) {
      selected.add(url);
    }
  }
  for (const url of previousUrls) {
    if (!currentEntries.has(url)) selected.add(url);
  }

  const changedFiles = changedFilesBetween(previous.deploymentSha, deploymentSha);
  for (const url of inferUpdatedUrls(changedFiles, currentUrls, previousUrls, origin)) {
    selected.add(url);
  }

  if (forceSubmit || previous.entries.size === 0) {
    for (const url of currentUrls) selected.add(url);
  }

  const urlList = [...selected].sort();
  if (urlList.length > MAX_URLS_PER_REQUEST) {
    throw new Error(`Refusing to submit ${urlList.length} URLs; IndexNow accepts at most ${MAX_URLS_PER_REQUEST}`);
  }

  if (urlList.length > 0 && !dryRun) {
    const keyResponse = await fetchImpl(keyLocation, {
      headers: { 'user-agent': 'Shoonaya-IndexNow/1.0' },
    });
    if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
      throw new Error('The live IndexNow key file is missing or does not match the repository key');
    }

    const indexNowResponse = await fetchImpl(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(origin).host,
        key,
        keyLocation,
        urlList,
      }),
    });
    if (![200, 202].includes(indexNowResponse.status)) {
      throw new Error(
        `IndexNow rejected the submission (${indexNowResponse.status} ${indexNowResponse.statusText})`,
      );
    }
  }

  await writeSnapshot(snapshotPath, deploymentSha, currentEntries);
  const mode = dryRun ? 'dry run' : 'live';
  console.log(`IndexNow ${mode}: ${urlList.length} URL(s) selected from ${currentEntries.size} sitemap URL(s).`);
  await appendSummary([
    '### IndexNow submission',
    '',
    `- Sitemap URLs: ${currentEntries.size}`,
    `- Submitted URLs: ${urlList.length}`,
    `- Mode: ${mode}`,
  ]);

  return { currentEntries, urlList, changedFiles };
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  run().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
