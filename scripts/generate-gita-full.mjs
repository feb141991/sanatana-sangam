import { writeFile } from 'node:fs/promises';

const CHAPTERS = [
  { number: 1, verseCount: 47 },
  { number: 2, verseCount: 72 },
  { number: 3, verseCount: 43 },
  { number: 4, verseCount: 42 },
  { number: 5, verseCount: 29 },
  { number: 6, verseCount: 47 },
  { number: 7, verseCount: 30 },
  { number: 8, verseCount: 28 },
  { number: 9, verseCount: 34 },
  { number: 10, verseCount: 42 },
  { number: 11, verseCount: 55 },
  { number: 12, verseCount: 20 },
  { number: 13, verseCount: 35 },
  { number: 14, verseCount: 27 },
  { number: 15, verseCount: 20 },
  { number: 16, verseCount: 24 },
  { number: 17, verseCount: 28 },
  { number: 18, verseCount: 78 },
];
const EXPECTED_TOTAL_VERSES = CHAPTERS.reduce((sum, chapter) => sum + chapter.verseCount, 0);

const API_BASE = 'https://en.wikisource.org/w/api.php?action=parse&prop=text&format=json&page=';
const TITLE_PREFIX = 'Bhagavad-Gita_%28Besant_4th%29/Discourse_';
const OUTPUT_FILE = new URL('../src/lib/gita-full-data.ts', import.meta.url);
const ATTRIBUTION =
  'Original Sanskrit and the English meaning are sourced from the public-domain Annie Besant translation of the Bhagavad-Gita on Wikisource. Transliteration is generated in-app from the Sanskrit text.';

const INDEPENDENT_VOWELS = {
  'अ': 'a',
  'आ': 'ā',
  'इ': 'i',
  'ई': 'ī',
  'उ': 'u',
  'ऊ': 'ū',
  'ऋ': 'ṛ',
  'ॠ': 'ṝ',
  'ऌ': 'ḷ',
  'ॡ': 'ḹ',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
};

const VOWEL_SIGNS = {
  'ा': 'ā',
  'ि': 'i',
  'ी': 'ī',
  'ु': 'u',
  'ू': 'ū',
  'ृ': 'ṛ',
  'ॄ': 'ṝ',
  'ॢ': 'ḷ',
  'ॣ': 'ḹ',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
};

const CONSONANTS = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'ṅ',
  'च': 'c',
  'छ': 'ch',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'ñ',
  'ट': 'ṭ',
  'ठ': 'ṭh',
  'ड': 'ḍ',
  'ढ': 'ḍh',
  'ण': 'ṇ',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'ph',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'व': 'v',
  'श': 'ś',
  'ष': 'ṣ',
  'स': 's',
  'ह': 'h',
  'ळ': 'ḷ',
};

const SPECIALS = {
  'ं': 'ṃ',
  'ः': 'ḥ',
  'ँ': 'm̐',
  'ऽ': '\'',
  '।': ' | ',
  '॥': ' || ',
};

const ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': '\'',
  '&rsquo;': '\'',
  '&lsquo;': '\'',
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&ndash;': '–',
  '&mdash;': '—',
};

const DEVANAGARI_DIGITS = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&[a-z]+;/gi, (entity) => ENTITY_MAP[entity] ?? entity);
}

function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<sup[\s\S]*?<\/sup>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<link[^>]*>/g, '')
      .replace(/<span[^>]*class="pagenum[\s\S]*?<\/span>/g, '')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\u200b/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractParagraphs(fragment) {
  const paragraphs = [...fragment.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  return paragraphs;
}

function transliterateSanskrit(text) {
  const chars = [...text.normalize('NFC')];
  let output = '';

  for (let index = 0; index < chars.length; index += 1) {
    const current = chars[index];
    const next = chars[index + 1];

    if (INDEPENDENT_VOWELS[current]) {
      output += INDEPENDENT_VOWELS[current];
      continue;
    }

    if (CONSONANTS[current]) {
      if (next === '़') {
        output += CONSONANTS[current];
        index += 1;
        continue;
      }

      if (VOWEL_SIGNS[next]) {
        output += CONSONANTS[current] + VOWEL_SIGNS[next];
        index += 1;
        continue;
      }

      if (next === '्') {
        output += CONSONANTS[current];
        index += 1;
        continue;
      }

      output += `${CONSONANTS[current]}a`;
      continue;
    }

    if (SPECIALS[current]) {
      output += SPECIALS[current];
      continue;
    }

    output += current;
  }

  const transliterated = output
    .replace(/\s+\|\s+\|\s+/g, ' || ')
    .replace(/\s+\|\s+/g, ' | ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();

  return normalizeDigits(transliterated);
}

function normalizeDigits(value) {
  return value.replace(/[०-९]/g, (digit) => DEVANAGARI_DIGITS[digit] ?? digit);
}

function parseVersesFromHtml(html, chapterNumber) {
  const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  const verses = [];
  let sanskritPrelude = [];
  let currentVerseNumber = null;
  let currentOriginal = '';
  let englishParagraphs = [];

  const finalizeCurrentVerse = () => {
    if (!currentVerseNumber || !currentOriginal || englishParagraphs.length === 0) {
      return;
    }

    verses.push({
      id: `gita-${chapterNumber}-${currentVerseNumber}`,
      title: `Bhagavad Gita ${chapterNumber}.${currentVerseNumber}`,
      source: `Bhagavad Gita ${chapterNumber}.${currentVerseNumber}`,
      original: currentOriginal,
      transliteration: transliterateSanskrit(currentOriginal),
      meaning: englishParagraphs.join('\n'),
      tradition: 'hindu',
      category: 'gita',
      tags: [
        'gita',
        'pathshala',
        'canonical',
        'public-domain-translation',
        'wikisource-besant',
        `chapter-${chapterNumber}`,
      ],
      attribution: ATTRIBUTION,
    });
  };

  for (const paragraph of paragraphs) {
    const isSanskrit = /[\u0900-\u097f]/.test(paragraph);
    const verseNumberMatch = paragraph.match(/॥\s*([\d०-९]+)\s*॥/);

    if (isSanskrit) {
      if (currentVerseNumber) {
        finalizeCurrentVerse();
        currentVerseNumber = null;
        currentOriginal = '';
        englishParagraphs = [];
      }

      if (verseNumberMatch) {
        currentVerseNumber = Number(normalizeDigits(verseNumberMatch[1]));
        currentOriginal = [...sanskritPrelude, paragraph].join('\n').trim();
        sanskritPrelude = [];
        continue;
      }

      if (paragraph.includes('उवाच') || paragraph.includes('।') || paragraph.length > 12) {
        sanskritPrelude.push(paragraph);
      }

      continue;
    }

    if (currentVerseNumber) {
      englishParagraphs.push(paragraph);
    }
  }

  finalizeCurrentVerse();

  const deduped = new Map();
  for (const verse of verses) {
    const verseNumber = Number(verse.id.split('-')[2]);
    const existing = deduped.get(verseNumber);
    if (!existing || verse.meaning.length > existing.meaning.length) {
      deduped.set(verseNumber, verse);
    }
  }

  return Array.from(deduped.values()).sort((left, right) => {
    const leftVerse = Number(left.id.split('-')[2]);
    const rightVerse = Number(right.id.split('-')[2]);
    return leftVerse - rightVerse;
  });
}

async function fetchChapterHtml(chapterNumber) {
  const page = `${TITLE_PREFIX}${chapterNumber}`;
  const url = `${API_BASE}${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch chapter ${chapterNumber}: ${response.status}`);
  }

  const payload = await response.json();
  const html = payload?.parse?.text?.['*'];

  if (!html) {
    throw new Error(`Missing parsed HTML for chapter ${chapterNumber}`);
  }

  return html;
}

function createOutput(entries) {
  const serialized = JSON.stringify(entries, null, 2);
  return `// Generated by scripts/generate-gita-full.mjs\n// Source: public-domain Annie Besant translation on Wikisource\n\nexport const GITA_FULL_DATA = ${serialized} as const;\n`;
}

async function main() {
  const allEntries = [];

  for (const chapter of CHAPTERS) {
    const html = await fetchChapterHtml(chapter.number);
    const entries = parseVersesFromHtml(html, chapter.number);

    if (entries.length !== chapter.verseCount) {
      console.error(
        `Chapter ${chapter.number} verse numbers: ${entries
          .map((entry) => entry.id.split('-')[2])
          .join(', ')}`,
      );
      throw new Error(
        `Chapter ${chapter.number} parsed ${entries.length} verses, expected ${chapter.verseCount}`,
      );
    }

    allEntries.push(...entries);
  }

  if (allEntries.length !== EXPECTED_TOTAL_VERSES) {
    throw new Error(`Parsed ${allEntries.length} verses, expected ${EXPECTED_TOTAL_VERSES}`);
  }

  await writeFile(OUTPUT_FILE, createOutput(allEntries), 'utf8');
  console.log(`Generated ${allEntries.length} Gita verses in ${OUTPUT_FILE.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
