import { writeFile } from 'node:fs/promises';

const OUTPUT_FILE = new URL('../src/lib/upanishads-full-data.ts', import.meta.url);
const OCR_URL =
  'https://archive.org/download/thirteenprincipa00hume/thirteenprincipa00hume_djvu.txt';
const SOURCE_URL = 'https://archive.org/details/thirteenprincipa00hume';

const TEXTS = [
  {
    id: 'upa-brihadaranyaka-full',
    title: 'Brihadaranyaka Upanishad',
    marker: 'BRIHAD-ARANYAKA UPANISHAD',
    summary:
      'One of the largest and deepest Upanishads, exploring neti neti, sacrifice, selfhood, and liberation through wide-ranging dialogues.',
    tags: ['upanishad', 'principal-upanishad', 'brihadaranyaka', 'neti-neti', 'atman'],
  },
  {
    id: 'upa-chandogya-full',
    title: 'Chandogya Upanishad',
    marker: 'CHANDOGYA UPANISHAD',
    summary:
      'A major Upanishadic text on Being, sacred utterance, meditation, inward sacrifice, and the identity of self with the absolute.',
    tags: ['upanishad', 'principal-upanishad', 'chandogya', 'tat-tvam-asi', 'brahman'],
  },
  {
    id: 'upa-taittiriya-full',
    title: 'Taittiriya Upanishad',
    marker: 'TAITTIRIYA UPANISHAD',
    summary:
      'The Upanishad of disciplined learning, the five sheaths, Brahman as bliss, and the ethics of the student path.',
    tags: ['upanishad', 'principal-upanishad', 'taittiriya', 'pancha-kosha', 'bliss'],
  },
  {
    id: 'upa-aitareya-full',
    title: 'Aitareya Upanishad',
    marker: 'AITAREYA UPANISHAD',
    summary:
      'A creation-centered Upanishad that reflects on embodiment, consciousness, and the primacy of the Self.',
    tags: ['upanishad', 'principal-upanishad', 'aitareya', 'creation', 'consciousness'],
  },
  {
    id: 'upa-kaushitaki-full',
    title: 'Kaushitaki Upanishad',
    marker: 'KAUSHITAKI UPANISHAD',
    summary:
      'A dialogue-rich Upanishad on prana, consciousness, death, and the inward ascent toward the highest truth.',
    tags: ['upanishad', 'principal-upanishad', 'kaushitaki', 'prana', 'consciousness'],
  },
  {
    id: 'upa-kena-full',
    title: 'Kena Upanishad',
    marker: 'KENA UPANISHAD',
    summary:
      'A concise inquiry into the power behind mind, speech, sight, and hearing, pointing beyond ordinary cognition toward Brahman.',
    tags: ['upanishad', 'principal-upanishad', 'kena', 'brahman', 'mind'],
  },
  {
    id: 'upa-katha-full',
    title: 'Katha Upanishad',
    marker: 'KATHA UPANISHAD',
    summary:
      'Nachiketas’ dialogue with Yama on death, immortality, discernment, and the nature of the Self.',
    tags: ['upanishad', 'principal-upanishad', 'katha', 'nachiketas', 'death'],
  },
  {
    id: 'upa-isa-full',
    title: 'Isha Upanishad',
    marker: 'ISA UPANISHAD',
    summary:
      'A compact but foundational Upanishad on renunciation, action, inner vision, and the all-pervading Lord.',
    tags: ['upanishad', 'principal-upanishad', 'isa', 'renunciation', 'action'],
  },
  {
    id: 'upa-mundaka-full',
    title: 'Mundaka Upanishad',
    marker: 'MUNDAKA UPANISHAD',
    summary:
      'A teaching on higher and lower knowledge, the imperishable reality, and the turning from ritual to realization.',
    tags: ['upanishad', 'principal-upanishad', 'mundaka', 'knowledge', 'realization'],
  },
  {
    id: 'upa-prashna-full',
    title: 'Prashna Upanishad',
    marker: 'PRASNA UPANISHAD',
    summary:
      'Six seeker-questions on prana, OM, the cosmic person, and the layered structure of spiritual inquiry.',
    tags: ['upanishad', 'principal-upanishad', 'prashna', 'questions', 'om'],
  },
  {
    id: 'upa-mandukya-full',
    title: 'Mandukya Upanishad',
    marker: 'MANDUKYA UPANISHAD',
    summary:
      'A brief but profound Upanishad on OM, waking, dream, deep sleep, and the fourth state beyond them.',
    tags: ['upanishad', 'principal-upanishad', 'mandukya', 'om', 'turiya'],
  },
  {
    id: 'upa-svetasvatara-full',
    title: 'Svetasvatara Upanishad',
    marker: 'SVETASVATARA UPANISHAD',
    summary:
      'A devotional-philosophical Upanishad joining metaphysics, yoga, and a more personal expression of the divine.',
    tags: ['upanishad', 'principal-upanishad', 'svetasvatara', 'yoga', 'ishvara'],
  },
  {
    id: 'upa-maitri-full',
    title: 'Maitri Upanishad',
    marker: 'MAITRI UPANISHAD',
    summary:
      'A later but important Upanishad weaving together self-knowledge, meditation, time, mind, and release.',
    tags: ['upanishad', 'principal-upanishad', 'maitri', 'meditation', 'mind'],
  },
];

const ATTRIBUTION =
  'Complete public-domain English study text from Robert Ernest Hume’s 1921 The Thirteen Principal Upanishads, sourced from the Internet Archive OCR text. This Pathshala import currently uses the translated study text as the complete local text; original-script and recitation layers will be added separately when a rights-safe source path is finalized.';

async function fetchCorpus() {
  const response = await fetch(OCR_URL);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${OCR_URL}`);
  }
  return response.text();
}

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/l£A\s+UPANISHAD/gi, 'ISA UPANISHAD')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function cleanSlice(text) {
  return text
    .split('\n')
    .filter((line) => !/^\s*\d+\s*$/.test(line))
    .filter((line) => !/^\s*(PHILOSOPHY OF THE UPANISHADS|BIBLIOGRAPHY)\s*$/i.test(line))
    .filter((line) => !/^\s*[-\[\]0-9. iIvVxXJ]+ ?(?:BRIHAD-ARANYAKA|CHANDOGYA|TAITTIRIYA|AITAREYA|KAUSHITAKI|KENA|KATHA|ISA|MUNDAKA|PRASNA|MANDUKYA|SVETASVATARA|MAITRI) UPANISHAD/i.test(line))
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTexts(fullText) {
  const upper = fullText.toUpperCase();
  const slices = [];
  let searchStart = 0;

  for (let index = 0; index < TEXTS.length; index += 1) {
    const current = TEXTS[index];
    const currentHeading = `\n\n${current.marker}`;
    const start = upper.indexOf(currentHeading, searchStart);

    if (start === -1) {
      throw new Error(`Could not find start marker for ${current.title}`);
    }

    const nextMarker = TEXTS[index + 1]?.marker;
    const nextHeading = nextMarker ? `\n\n${nextMarker}` : null;
    const end = nextHeading
      ? upper.indexOf(nextHeading, start + currentHeading.length)
      : upper.indexOf('A BIBLIOGRAPHY', start);

    if (end === -1) {
      throw new Error(`Could not find end marker for ${current.title}`);
    }

    slices.push({
      meta: current,
      text: cleanSlice(fullText.slice(start, end)),
    });

    searchStart = end;
  }

  return slices;
}

function serialize(value) {
  return JSON.stringify(value, null, 2);
}

async function main() {
  const raw = await fetchCorpus();
  const normalized = normalizeText(raw);
  const texts = extractTexts(normalized).map(({ meta, text }) => ({
    id: meta.id,
    title: meta.title,
    source: `${meta.title} — Robert Ernest Hume (1921)`,
    original: '',
    transliteration: '',
    meaning: meta.summary,
    tradition: 'hindu',
    category: 'upanishad',
    tags: [...meta.tags, 'pathshala', 'canonical', 'public-domain-translation', 'internet-archive-hume'],
    attribution: ATTRIBUTION,
    sourceUrl: SOURCE_URL,
    fullText: text,
  }));

  const output =
    '// Generated by scripts/generate-upanishads-full.mjs\n' +
    '// Public-domain English study text from Robert Ernest Hume via Internet Archive.\n\n' +
    `export const UPANISHADS_FULL_DATA = ${serialize(texts)} as const;\n`;

  await writeFile(OUTPUT_FILE, output, 'utf8');
  console.log(`Generated ${texts.length} Upanishad texts in ${OUTPUT_FILE.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
