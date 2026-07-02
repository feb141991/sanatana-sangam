const fs = require('fs');
let code = fs.readFileSync('src/lib/ai/retrieval.ts', 'utf-8');

// Replace lines 1026 to 1042
const replaceStart = "const buddhistManifestRetriever2";
const replaceEnd = "// Removed duplicate registration\n\nexport async function retrievePathshalaContext";

const targetChunk = code.substring(code.indexOf(replaceStart), code.indexOf("export async function retrievePathshalaContext"));

const replacement = `const ramayanaManifestRetriever = new PramanaManifestRetriever({
  prefix: 'ramayana',
  sourceName: 'Valmiki Ramayana',
  sourceClass: 'itihasa',
  tradition: 'Sanatana Dharma',
  fileNames: [
    'ramayana_bal.json',
    'ramayana_ayodhya.json',
    'ramayana_aranya.json',
    'ramayana_kishkindha.json',
    'ramayana_sundara.json',
    'ramayana_yuddha.json',
    'ramayana_uttara.json'
  ]
});

PramanaRetrieverSelector.register('ramayana', new PramanaGenericEmbeddingRetriever(
  ramayanaManifestRetriever,
  path.join(process.cwd(), 'python/ai_pipeline/corpus/ramayana_index.json'),
  'Sanatana Dharma',
  'Valmiki Ramayana'
));\n\n`;

code = code.replace(targetChunk, replacement);

const fallbackTarget = `const corpusId = (input.corpus as any) || selector.selectCorpus(
    \`\${input.title ?? ''} \${input.source ?? ''}\`.trim(),
    {
      source: input.source || null,
      title: input.title || null,
      tradition: input.tradition || null,
    }
  );`;

const fallbackReplacement = `let corpusId = (input.corpus as any) || selector.selectCorpus(
    \`\${input.title ?? ''} \${input.source ?? ''}\`.trim(),
    {
      source: input.source || null,
      title: input.title || null,
      tradition: input.tradition || null,
    }
  );

  // Prevent accidental fallback to Ramayana if just "hindu" or "sanatana dharma" is specified, unless explicitly requested.
  // We keep the defaults to BG or Upanishads for generic queries.
  if (corpusId === 'ramayana') {
    const rawQuery = \`\${input.title ?? ''} \${input.source ?? ''}\`.toLowerCase();
    if (!rawQuery.includes('ramayana') && !rawQuery.includes('valmiki') && !rawQuery.includes('kanda') && !rawQuery.includes('rama') && !rawQuery.includes('sita') && !rawQuery.includes('hanuman')) {
      // If it accidentally resolved to Ramayana without explicit keyword, route back to Gita or Upanishads
      corpusId = 'bhagavad_gita';
    }
  }`;

code = code.replace(fallbackTarget, fallbackReplacement);
fs.writeFileSync('src/lib/ai/retrieval.ts', code, 'utf-8');
console.log("Patched src/lib/ai/retrieval.ts");
