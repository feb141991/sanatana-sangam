import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const OUTPUT_FILE = new URL('../src/lib/upanishads-original-data.ts', import.meta.url);
const execFileAsync = promisify(execFile);

const TEXTS = [
  {
    id: 'upa-brihadaranyaka-full',
    title: 'Brihadaranyaka Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/brihadaranyakopanishad/',
  },
  {
    id: 'upa-chandogya-full',
    title: 'Chandogya Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/chandogyopanishad/',
  },
  {
    id: 'upa-taittiriya-full',
    title: 'Taittiriya Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/taittiriya-upanishads/',
    segments: [
      {
        url: 'https://vedicheritage.gov.in/upanishads/taittiriya-upanishads/',
        mode: 'content-column',
      },
      {
        url: 'https://vedicheritage.gov.in/upanishads/taittiriya-upanishadsbrahmananda-valli/',
        mode: 'content-column',
      },
      {
        url: 'https://vedicheritage.gov.in/upanishads/taittiriya-upanishadsbhighu-valli/',
        mode: 'content-column',
      },
    ],
  },
  {
    id: 'upa-aitareya-full',
    title: 'Aitareya Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/aitareyopanishad/',
  },
  {
    id: 'upa-kena-full',
    title: 'Kena Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/kenopanisad/',
  },
  {
    id: 'upa-katha-full',
    title: 'Katha Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/kathopanishad/',
  },
  {
    id: 'upa-isa-full',
    title: 'Isha Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/ishavasyopanishad/',
  },
  {
    id: 'upa-mundaka-full',
    title: 'Mundaka Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/mundakopanishad/',
  },
  {
    id: 'upa-prashna-full',
    title: 'Prashna Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/prashnopanishad/',
  },
  {
    id: 'upa-mandukya-full',
    title: 'Mandukya Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/mandukyopanishad/',
  },
  {
    id: 'upa-svetasvatara-full',
    title: 'Svetasvatara Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/shwetashwataropanishad/',
  },
  {
    id: 'upa-maitri-full',
    title: 'Maitri Upanishad',
    url: 'https://vedicheritage.gov.in/upanishads/maitrayani-upanishad/',
  },
];

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function cleanExtractedText(text) {
  return text
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/�/g, '')
    .replace(/^\s*Part\s+[IVXLC]+\s*$/gim, '')
    .replace(/^\s*Canto\s+[IVXLC]+\s*$/gim, '')
    .replace(/^\s*इति\s+.*समाप्\s*$/gim, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToText(raw) {
  return decodeHtmlEntities(raw)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<h\d[^>]*>/gi, '')
    .replace(/<\/h\d>/gi, '\n\n')
    .replace(/<video[\s\S]*?<\/video>/gi, '')
    .replace(/<source[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '');
}

function extractVideoText(html) {
  const start = html.indexOf('<div id="videotext"');
  if (start === -1) {
    return null;
  }

  const contentStart = html.indexOf('>', start) + 1;
  const end = html.indexOf('<h3 class="hdngtxtnew">Samhita', contentStart);

  if (end === -1) {
    return null;
  }

  const raw = html.slice(contentStart, end);
  const cleaned = cleanExtractedText(htmlToText(raw));

  if (!cleaned.includes('॥')) {
    return null;
  }

  return cleaned;
}

function extractContentColumn(html) {
  const blocks = Array.from(
    html.matchAll(/<div class="col-lg-6 col-md-6 col-sm-6"[^>]*>([\s\S]*?)<\/div>/g),
    (match) => match[1],
  );

  if (blocks.length === 0) {
    return null;
  }

  const candidates = blocks
    .map((block) => {
      const text = cleanExtractedText(htmlToText(block));
      const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => /[ऀ-ॿॐ᳚᳛᳡ꣳ॥।]/u.test(line))
        .filter((line) => !/^(Samhita|Brahmana|Aranyaka|UPANISHAD|Upanishad)$/i.test(line));

      const cleaned = lines.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
      const verseMarkers = (cleaned.match(/॥/g) ?? []).length;
      const devanagariChars = (cleaned.match(/[ऀ-ॿॐ᳚᳛᳡ꣳ]/gu) ?? []).length;

      return {
        cleaned,
        score: verseMarkers * 100 + devanagariChars,
      };
    })
    .filter((candidate) => candidate.cleaned.includes('॥'));

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].cleaned;
}

function extractOriginalText(html, mode = 'videotext') {
  if (mode === 'content-column') {
    return extractContentColumn(html);
  }

  return extractVideoText(html);
}

function serialize(value) {
  return JSON.stringify(value, null, 2);
}

async function main() {
  const rows = [];

  for (const text of TEXTS) {
    const segments = text.segments ?? [{ url: text.url, mode: 'videotext' }];
    const originals = [];

    for (const segment of segments) {
      const { stdout: html } = await execFileAsync('curl', ['-L', '--max-time', '30', segment.url], {
        maxBuffer: 10 * 1024 * 1024,
      });

      const original = extractOriginalText(html, segment.mode);
      if (original) {
        originals.push(original);
      }
    }

    const combinedOriginal = originals.join('\n\n');

    rows.push({
      id: text.id,
      original: combinedOriginal,
      companionSourceUrl: text.url,
      companionSourceLabel: 'Vedic Heritage source page',
      originalLayerStatus: combinedOriginal ? 'live' : 'companion',
      recitationLayerStatus: 'companion',
    });
  }

  const output =
    '// Generated by scripts/generate-upanishads-original.mjs\n' +
    '// Sanskrit source layer pulled from the Vedic Heritage Portal pages for the principal Upanishads.\n\n' +
    `export const UPANISHADS_ORIGINAL_DATA = ${serialize(rows)} as const;\n`;

  await writeFile(OUTPUT_FILE, output, 'utf8');
  console.log(`Generated ${rows.length} Upanishad original-text layers in ${OUTPUT_FILE.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
