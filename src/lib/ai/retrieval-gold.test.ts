import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PramanaDenseEmbeddingRetriever, PramanaManifestRetriever } from './retrieval';
import { rankOfFirstExpected, summariseRetrieval } from './retrieval-eval-metrics';

// Retrieval-quality regression gate. Runs the real dense retrievers over the English
// paraphrase cases in the gold dataset (the same cases scripts/eval_retrieval_quality.ts
// reports) and fails if quality drops below the floors. The floors sit just under the
// values measured when they were set, so a deliberate improvement should raise them:
//
//   Gita dense (67 cases):        hit@1 40, hit@3 52, hit@5 55, MRR 0.687   (origin/main: 34, 43, 49, 0.593)
//   Upanishads dense (11 cases):  hit@5 11, MRR 1.000
//
// What each floor guards: hit@1 and MRR fall if the embedded text regresses to carrying
// the "Bhagavad Gita 2.47." label (34 of 67 at hit@1); hit@3 falls if neighbouring verses
// are spliced in ahead of the next-best matches (43 of 67 at hit@3), which is what chat
// reads. Hindi and Punjabi cases are skipped: they need the paid translation API.

const root = process.cwd();
const goldPath = path.join(root, 'python/ai_pipeline/datasets/evals/retrieval_quality.gold.jsonl');
const corpusDir = path.join(root, 'python/ai_pipeline/corpus');

type GoldCase = { case_id: string; corpus: string; query: string; expected_ids: string[]; language?: string };

function loadEnglishCases(corpus: string): GoldCase[] {
  return fs.readFileSync(goldPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GoldCase)
    .filter((testCase) => testCase.corpus === corpus && (testCase.language ?? 'en') === 'en');
}

async function summarise(retriever: PramanaDenseEmbeddingRetriever, source: string, cases: GoldCase[]) {
  const outcomes = [];
  for (const testCase of cases) {
    const result = await retriever.retrieve({ text: testCase.query, filters: { source }, topK: 5 });
    const ids = result.documents.slice(0, 5).map((doc) => doc.id).filter((id): id is string => typeof id === 'string');
    outcomes.push({ rank: rankOfFirstExpected(ids, testCase.expected_ids) });
  }
  return summariseRetrieval(outcomes);
}

describe('dense retrieval quality on the gold set', () => {
  it('finds the right Gita verse at or above the recorded floors', async () => {
    const manifest = new PramanaManifestRetriever({
      prefix: 'gita_chapter', sourceName: 'Bhagavad Gita', sourceClass: 'scripture', tradition: 'Sanatana Dharma', maxChapters: 18,
    });
    const dense = new PramanaDenseEmbeddingRetriever(manifest, path.join(corpusDir, 'gita_index_dense.json'), 'Bhagavad Gita', 'Sanatana Dharma');
    const cases = loadEnglishCases('pathshala_gita');
    expect(cases.length).toBeGreaterThanOrEqual(67);

    const s = await summarise(dense, 'Bhagavad Gita', cases);
    expect(s.hit1, `hit@1 ${JSON.stringify(s)}`).toBeGreaterThanOrEqual(39);
    expect(s.hit3, `hit@3 ${JSON.stringify(s)}`).toBeGreaterThanOrEqual(51);
    expect(s.hit5, `hit@5 ${JSON.stringify(s)}`).toBeGreaterThanOrEqual(54);
    expect(s.mrr, `MRR ${JSON.stringify(s)}`).toBeGreaterThanOrEqual(0.67);
  }, 120_000);

  it('keeps every Upanishad case in the top five', async () => {
    const manifest = new PramanaManifestRetriever({
      prefix: 'upanishad', sourceName: 'Upanishads', sourceClass: 'scripture', tradition: 'Sanatana Dharma',
      fileNames: [
        'upanishad_isha.json', 'upanishad_kena.json', 'upanishad_katha.json', 'upanishad_mundaka.json',
        'upanishad_mandukya.json', 'upanishad_prashna.json', 'upanishad_taittiriya.json', 'upanishad_aitareya.json',
        'upanishad_chandogya.json', 'upanishad_brihadaranyaka.json', 'upanishad_shvetashvatara.json',
      ],
    });
    const dense = new PramanaDenseEmbeddingRetriever(manifest, path.join(corpusDir, 'upanishads_index_dense.json'), 'Upanishads', 'Sanatana Dharma');
    const cases = loadEnglishCases('pathshala_upanishads');
    expect(cases).toHaveLength(11);

    const s = await summarise(dense, 'Upanishads', cases);
    expect(s.hit5, `hit@5 ${JSON.stringify(s)}`).toBe(11);
    expect(s.mrr, `MRR ${JSON.stringify(s)}`).toBeGreaterThanOrEqual(0.95);
  }, 120_000);
});
