/**
 * Retrieval quality eval: sparse TF-IDF vs dense embedding retrieval.
 *
 * Runs every case in python/ai_pipeline/datasets/evals/retrieval_quality.gold.jsonl
 * through both retrievers, built exactly as src/lib/ai/retrieval.ts builds them,
 * and reports hit@1 / hit@3 / hit@5 and MRR per corpus. A case is a hit when any
 * of its `expected_ids` (index document ids, each verified against the corpus
 * text when the case was written) appears in the top k results.
 *
 * Cases are plain-language paraphrases, so they exercise semantic matching.
 * Explicit "Gita 2.47"-style citations are routed to the manifest retriever by
 * PramanaDenseEmbeddingRetriever and are covered by run_evals.py instead.
 *
 * Hindi and Punjabi cases (`language` "hi"/"pa") are searched the way the chat
 * route searches them: translated to English first (src/lib/ai/query-language).
 * That calls the paid Sarvam API, so they only run with --translate and a
 * SARVAM_API_KEY; otherwise they are reported as skipped.
 *
 * Usage:
 *   npx tsx scripts/eval_retrieval_quality.ts            # English cases
 *   npx tsx scripts/eval_retrieval_quality.ts --gate     # exit 1 if dense hit@5 or MRR falls below sparse on any corpus (English cases)
 *   SARVAM_API_KEY=... npx tsx scripts/eval_retrieval_quality.ts --translate   # also Hindi/Punjabi via translation
 *   npx tsx scripts/eval_retrieval_quality.ts --json out.json
 */
import fs from 'fs';
import path from 'path';
import {
  PramanaDenseEmbeddingRetriever,
  PramanaGitaEmbeddingRetriever,
  PramanaManifestRetriever,
  PramanaUpanishadsEmbeddingRetriever,
} from '../src/lib/ai/retrieval';
import { rankOfFirstExpected, summariseRetrieval } from '../src/lib/ai/retrieval-eval-metrics';
import { toRetrievalQuery } from '../src/lib/ai/query-language';

type GoldCase = { case_id: string; corpus: string; query: string; expected_ids: string[]; kind: string; language?: string };
type Retriever = PramanaDenseEmbeddingRetriever | PramanaGitaEmbeddingRetriever | PramanaUpanishadsEmbeddingRetriever;
type CaseOutcome = { caseId: string; corpus: string; language: string; retriever: string; rank: number | null; topIds: string[] };

const K = 5;
const root = process.cwd();
const datasetPath = path.join(root, 'python/ai_pipeline/datasets/evals/retrieval_quality.gold.jsonl');

function buildRetrievers(): Record<string, { source: string; sparse: Retriever; dense: Retriever }> {
  const gitaManifest = new PramanaManifestRetriever({
    prefix: 'gita_chapter',
    sourceName: 'Bhagavad Gita',
    sourceClass: 'scripture',
    tradition: 'Sanatana Dharma',
    maxChapters: 18,
  });
  const upanishadsManifest = new PramanaManifestRetriever({
    prefix: 'upanishad',
    sourceName: 'Upanishads',
    sourceClass: 'scripture',
    tradition: 'Sanatana Dharma',
    fileNames: [
      'upanishad_isha.json', 'upanishad_kena.json', 'upanishad_katha.json', 'upanishad_mundaka.json',
      'upanishad_mandukya.json', 'upanishad_prashna.json', 'upanishad_taittiriya.json', 'upanishad_aitareya.json',
      'upanishad_chandogya.json', 'upanishad_brihadaranyaka.json', 'upanishad_shvetashvatara.json',
    ],
  });
  const corpusDir = path.join(root, 'python/ai_pipeline/corpus');
  return {
    pathshala_gita: {
      source: 'Bhagavad Gita',
      sparse: new PramanaGitaEmbeddingRetriever(gitaManifest),
      dense: new PramanaDenseEmbeddingRetriever(gitaManifest, path.join(corpusDir, 'gita_index_dense.json'), 'Bhagavad Gita', 'Sanatana Dharma'),
    },
    pathshala_upanishads: {
      source: 'Upanishads',
      sparse: new PramanaUpanishadsEmbeddingRetriever(upanishadsManifest),
      dense: new PramanaDenseEmbeddingRetriever(upanishadsManifest, path.join(corpusDir, 'upanishads_index_dense.json'), 'Upanishads', 'Sanatana Dharma'),
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const gate = args.includes('--gate');
  const jsonIndex = args.indexOf('--json');
  const jsonOut = jsonIndex !== -1 ? args[jsonIndex + 1] : null;
  const translate = args.includes('--translate');
  const apiKey = process.env.SARVAM_API_KEY?.trim();
  if (translate && !apiKey) throw new Error('--translate needs SARVAM_API_KEY in the environment.');

  const cases: GoldCase[] = fs.readFileSync(datasetPath, 'utf-8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const retrievers = buildRetrievers();
  const outcomes: CaseOutcome[] = [];

  let skipped = 0;
  for (const testCase of cases) {
    const corpus = retrievers[testCase.corpus];
    if (!corpus) throw new Error(`No retrievers configured for corpus "${testCase.corpus}" (case ${testCase.case_id}).`);
    const language = testCase.language ?? 'en';
    let queryText = testCase.query;
    if (language !== 'en') {
      if (!translate) { skipped += 1; continue; }
      const retrievalQuery = await toRetrievalQuery(testCase.query, { apiKey });
      if (!retrievalQuery.translated) throw new Error(`Translation failed for ${testCase.case_id}: ${retrievalQuery.fallbackReason}`);
      queryText = retrievalQuery.text;
    }
    for (const [name, retriever] of [['sparse', corpus.sparse], ['dense', corpus.dense]] as const) {
      const result = await retriever.retrieve({ text: queryText, filters: { source: corpus.source }, topK: K });
      const topIds = result.documents.slice(0, K).map((doc) => doc.id).filter((id): id is string => typeof id === 'string');
      outcomes.push({ caseId: testCase.case_id, corpus: testCase.corpus, language, retriever: name, rank: rankOfFirstExpected(topIds, testCase.expected_ids), topIds });
    }
  }

  // English rows are the gated baseline; Hindi/Punjabi rows are reported per language.
  const report: Record<string, Record<string, ReturnType<typeof summariseRetrieval>>> = {};
  for (const corpus of Object.keys(retrievers)) {
    for (const language of ['en', 'hi', 'pa']) {
      const rows = outcomes.filter((o) => o.corpus === corpus && o.language === language);
      if (!rows.length) continue;
      const key = language === 'en' ? corpus : `${corpus} [${language}]`;
      report[key] = {};
      for (const name of ['sparse', 'dense']) report[key][name] = summariseRetrieval(rows.filter((o) => o.retriever === name));
    }
  }

  console.log('Retrieval quality (paraphrase queries, top', K, ')');
  console.log('corpus                      retriever  cases  hit@1  hit@3  hit@5  MRR');
  for (const [corpus, byRetriever] of Object.entries(report)) {
    for (const [name, s] of Object.entries(byRetriever)) {
      console.log(`${corpus.padEnd(27)} ${name.padEnd(10)} ${String(s.cases).padStart(5)}  ${String(s.hit1).padStart(5)}  ${String(s.hit3).padStart(5)}  ${String(s.hit5).padStart(5)}  ${s.mrr.toFixed(3)}`);
    }
  }
  if (skipped) console.log(`\n${skipped} Hindi/Punjabi cases skipped (run with --translate and SARVAM_API_KEY to include them).`);

  const misses = outcomes.filter((o) => o.retriever === 'dense' && o.rank === null);
  if (misses.length) {
    console.log('\nDense misses (expected passage not in top', K, '):');
    for (const miss of misses) console.log(`  ${miss.caseId}: got ${miss.topIds.join(', ') || '(nothing)'}`);
  }

  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ k: K, report, outcomes }, null, 2));

  if (gate) {
    const regressions = Object.entries(report).filter(([key, r]) => !key.includes('[') && (r.dense.hit5 < r.sparse.hit5 || r.dense.mrr < r.sparse.mrr));
    if (regressions.length) {
      console.error(`\nGATE FAILED: dense retrieval is below sparse on ${regressions.map(([c]) => c).join(', ')}.`);
      process.exit(1);
    }
    console.log('\nGate passed: dense retrieval is at least as good as sparse on every corpus.');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
