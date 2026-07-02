import * as fs from 'fs';

// GurbaniNow REST API — free, open-source, complete Nitnem database
// https://gurbaninow.com/
const BASE = 'https://api.gurbaninow.com/v2';

interface GurbaniNowVerse {
  id: number;
  gurmukhi: string;
  transliteration: { english: string };
  translation: { english: { ssk: string }; punjabi: { bdb: string }; spanish?: { ssk?: string } };
  steek?: { bdb?: string }; // Punjabi commentary
}

async function fetchBani(baniId: number): Promise<GurbaniNowVerse[]> {
  const res = await fetch(`${BASE}/banis/${baniId}/verses`);
  if (!res.ok) throw new Error(`API error ${res.status} for baniId ${baniId}`);
  const data = await res.json() as { verses: GurbaniNowVerse[] };
  return data.verses;
}

// Map verse → StotramVerse TypeScript literal
function toVerseEntry(v: GurbaniNowVerse, num: number): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
  const gurmukhi = esc(v.gurmukhi || '');
  const translit = esc(v.transliteration?.english || '');
  const meaning = esc(v.translation?.english?.ssk || '');
  const meaning_hi = esc(v.steek?.bdb || v.translation?.punjabi?.bdb || '');
  const meaning_pa = esc(v.translation?.punjabi?.bdb || '');

  return `      {
        number: ${num},
        sanskrit: \`${gurmukhi}\`,
        transliteration: \`${translit}\`,
        meaning: \`${meaning}\`,
        meaning_hi: \`${meaning_hi}\`,
        meaning_pa: \`${meaning_pa}\`,
      }`;
}

async function main() {
  // baniId reference (GurbaniNow v2):
  //   1  = Japji Sahib
  //   2  = Jaap Sahib (Dasam Granth)
  //   3  = Tav-Prasad Savaiye
  //   4  = Chaupai Sahib
  //   5  = Anand Sahib (6 pauri short version) | 6 = full 40 pauri
  //   7  = Rehras Sahib
  //   8  = Kirtan Sohila
  //   9  = Sukhmani Sahib
  //
  // VERIFY these IDs first:
  const listRes = await fetch(`${BASE}/banis`);
  const list = await listRes.json();
  console.log('Available banis:', JSON.stringify(list, null, 2));
  // From the list output, confirm baniId for each and update below.
  // Then re-run.

  const TARGET_BANIS = [
    { stotramId: 'japji-sahib-full',  baniId: 1, skipFirst: true },  // skip Mool Mantar (verse 1)
    { stotramId: 'jaap-sahib',        baniId: 2 },
    { stotramId: 'rehras-sahib',      baniId: 7 },
    { stotramId: 'kirtan-sohila',     baniId: 8 },
    { stotramId: 'sukhmani-sahib',    baniId: 9 },
  ];

  const output: Record<string, string> = {};
  for (const { stotramId, baniId, skipFirst } of TARGET_BANIS) {
    console.log(`Fetching ${stotramId} (baniId=${baniId})...`);
    const verses = await fetchBani(baniId);
    const start = skipFirst ? 1 : 0;
    const verseEntries = verses.slice(start).map((v, i) => toVerseEntry(v, i + 1));
    output[stotramId] = `    verses: [\n${verseEntries.join(',\n')}\n    ],`;
    console.log(`  → ${verses.length - (skipFirst ? 1 : 0)} verses`);
  }

  // Write output file for review
  const outPath = 'scripts/nitnem-verses.json';
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nDone. Verse arrays written to ${outPath}`);
  console.log('Review the JSON, then run: npx ts-node scripts/patch-nitnem.ts');
}

main().catch(console.error);
