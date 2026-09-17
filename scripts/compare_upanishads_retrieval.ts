import fs from 'fs';
import path from 'path';
import { PramanaManifestRetriever, PramanaUpanishadsEmbeddingRetriever, PramanaDenseEmbeddingRetriever } from '../src/lib/ai/retrieval';

async function main() {
  const datasetPath = path.join(process.cwd(), 'python/ai_pipeline/datasets/evals/pathshala_upanishads.sample.jsonl');
  const indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/upanishads_index.json');
  if (!fs.existsSync(datasetPath) || !fs.existsSync(indexPath)) {
    console.error('Dataset or Index not found');
    process.exit(1);
  }

  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const lines = fs.readFileSync(datasetPath, 'utf-8').split('\n').filter(Boolean);
  const cases = lines.map(l => JSON.parse(l));

  const heuristic = new PramanaManifestRetriever({
    prefix: 'upanishad',
    sourceName: 'Upanishads',
    sourceClass: 'scripture',
    tradition: 'Sanatana Dharma',
    fileNames: [
      'upanishad_isha.json',
      'upanishad_kena.json',
      'upanishad_katha.json',
      'upanishad_mundaka.json',
      'upanishad_mandukya.json',
      'upanishad_prashna.json',
      'upanishad_taittiriya.json',
      'upanishad_aitareya.json',
      'upanishad_chandogya.json',
      'upanishad_brihadaranyaka.json',
      'upanishad_shvetashvatara.json'
    ]
  });

  const embedding = new PramanaUpanishadsEmbeddingRetriever(heuristic);
  const denseIndexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/upanishads_index_dense.json');
  const dense = fs.existsSync(denseIndexPath)
    ? new PramanaDenseEmbeddingRetriever(heuristic, denseIndexPath, 'Upanishads', 'Sanatana Dharma')
    : null;

  console.log('================================================================================');
  console.log('📊 STRICT EVALUATION: HEURISTIC VS EMBEDDING-BACKED (UPANISHADS)');
  console.log('================================================================================\n');

  // Dense results are tracked and reported separately from `failed` -- this
  // script's exit code stays tied to the currently-live sparse retriever
  // only. Dense failures here are informational (plan step 3/4: proving
  // quality and re-tuning thresholds), not a CI-breaking regression, since
  // nothing dense is registered under a live corpus key yet.
  let failed = false;
  let denseFailed = false;
  let denseTotal = 0;
  let densePassed = 0;
  const reportRows: string[] = [];

  // Shared assertion logic so the dense path is checked against the exact
  // same expectations as the sparse path, not a hand-copied approximation.
  function checkStrictCase(
    docs: any[],
    provider: string | undefined,
    expectedProvider: string,
    hasTokens: boolean,
    mustCiteDocs: string[],
    chunkId: string | undefined,
    docId: string | undefined
  ): { passed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (docs.length === 0) {
      reasons.push('No documents returned.');
      return { passed: false, reasons };
    }
    if (hasTokens && provider !== expectedProvider) {
      reasons.push(`Provider must be ${expectedProvider}, got ${provider}.`);
    }
    if (mustCiteDocs.length > 0) {
      const top1DocId = docs[0].metadata?.docId;
      if (!mustCiteDocs.includes(top1DocId)) {
        reasons.push(`Expected doc ID from ${JSON.stringify(mustCiteDocs)} to be top-1, got ${top1DocId}.`);
      }
      if (!docs.some((d) => mustCiteDocs.includes(d.metadata?.docId))) {
        reasons.push('Expected doc ID not in top-k results.');
      }
    }
    if (chunkId) {
      const foundChunk = docs.some((d) => d.metadata?.chunkId === chunkId && d.metadata?.docId === docId);
      if (!foundChunk) reasons.push(`Expected specific chunk ${docId}_${chunkId} was not retrieved.`);
    }
    return { passed: reasons.length === 0, reasons };
  }

  for (const c of cases) {
    const chunkId = c.prompt.chunk_id;
    const docId = c.prompt.doc_id;
    const queryText = c.prompt.query ? c.prompt.query : c.prompt.story ? c.prompt.story : `${docId || 'Upanishads'} ${chunkId || ''}`.trim();
    const mustCiteDocs = c.expected?.must_cite_doc_ids || [];

    const rawTokens = queryText.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || [];
    const hasTokens = rawTokens.some((t: string) => indexData.idf[t] > 0);

    console.log(`📖 Eval Case: ${c.case_id} ("${queryText}")`);

    const resEmbed = await embedding.retrieve({
      text: queryText,
      filters: { source: 'Upanishads', title: docId }
    });

    const embedRefs = resEmbed.documents.map(d => `${d.metadata?.docId}_${d.metadata?.chunkId} (${d.score?.toFixed(2) || 'N/A'})`);
    console.log(`   [Sparse]  Provider: ${resEmbed.provider}`);
    console.log(`             Retrieved: ${embedRefs.join(', ') || 'NONE'}`);

    const sparseResult = checkStrictCase(resEmbed.documents as any[], resEmbed.provider, 'embedding-index', hasTokens, mustCiteDocs, chunkId, docId);
    for (const r of sparseResult.reasons) console.error(`   ❌ FAILED [sparse]: ${r}`);
    if (!sparseResult.passed) failed = true;

    let denseRefs: string[] = [];
    let denseProvider = 'n/a';
    if (dense) {
      denseTotal++;
      const resDense = await dense.retrieve({ text: queryText, filters: { source: 'Upanishads', title: docId } });
      denseRefs = resDense.documents.map(d => `${d.metadata?.docId}_${d.metadata?.chunkId} (${d.score?.toFixed(2) || 'N/A'})`);
      denseProvider = resDense.provider ?? 'fallback';
      console.log(`   [Dense]   Provider: ${denseProvider}`);
      console.log(`             Retrieved: ${denseRefs.join(', ') || 'NONE'}`);

      const denseResult = checkStrictCase(resDense.documents as any[], resDense.provider, 'dense-embedding-index', hasTokens, mustCiteDocs, chunkId, docId);
      if (denseResult.passed) {
        densePassed++;
      } else {
        denseFailed = true;
        for (const r of denseResult.reasons) console.log(`   ⚠️  dense mismatch: ${r}`);
      }
    }

    reportRows.push(`| ${c.case_id} | ${queryText.replace(/\|/g, '\\|')} | ${resEmbed.provider ?? 'fallback'} | ${embedRefs.join('<br>') || 'NONE'} | ${denseProvider} | ${denseRefs.join('<br>') || 'NONE'} |`);

    console.log('--------------------------------------------------------------------------------');
  }

  const naturalLanguageCases = [
    {
      caseId: 'natural-self',
      query: 'What do the Upanishads say about the Self?',
      expectedTopKDocIds: ['pathshala_upanishads_chandogya', 'pathshala_upanishads_mandukya', 'pathshala_upanishads_brihadaranyaka'],
      expectedTopKChunkIds: ['6.8.7', '1.2', '4.3.32']
    },
    {
      caseId: 'natural-neti-neti',
      query: 'Explain neti neti from the Upanishads.',
      expectedTop1DocId: 'pathshala_upanishads_brihadaranyaka',
      expectedTopKChunkIds: ['3.9.26']
    },
    {
      caseId: 'natural-mandukya-om',
      query: 'What is the meaning of Om in Mandukya Upanishad?',
      expectedTop1DocId: 'pathshala_upanishads_mandukya',
      expectedTopKChunkIds: ['1.1']
    },
    {
      caseId: 'natural-katha-death',
      query: 'What does Katha Upanishad teach about death?',
      expectedTop1DocId: 'pathshala_upanishads_katha',
      expectedTopKChunkIds: ['1.2']
    },
    {
      caseId: 'natural-brahman-atman',
      query: 'Give an Upanishadic source for Brahman and Atman.',
      expectedTopKDocIds: ['pathshala_upanishads_brihadaranyaka', 'pathshala_upanishads_mandukya'],
      expectedTopKChunkIds: ['1.4.10', '4.3.32', '1.2']
    }
  ];

  console.log('\n================================================================================');
  console.log('📊 NATURAL-LANGUAGE RETRIEVAL ASSERTIONS (NO TITLE/DOC_ID FILTERS)');
  console.log('================================================================================\n');

  function checkNaturalCase(docs: any[], check: typeof naturalLanguageCases[number]): { passed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (docs.length === 0) {
      reasons.push('No documents returned.');
      return { passed: false, reasons };
    }
    const top1DocId = docs[0].metadata?.docId;
    if ('expectedTop1DocId' in check && check.expectedTop1DocId && top1DocId !== check.expectedTop1DocId) {
      reasons.push(`Expected top-1 doc ${check.expectedTop1DocId}, got ${top1DocId}.`);
    }
    if ('expectedTopKDocIds' in check && check.expectedTopKDocIds?.length) {
      const foundDoc = docs.some((d) => check.expectedTopKDocIds.includes(d.metadata?.docId || ''));
      if (!foundDoc) reasons.push(`Expected one of ${JSON.stringify(check.expectedTopKDocIds)} in top-k.`);
    }
    const foundChunk = docs.some((d) => check.expectedTopKChunkIds.includes(d.metadata?.chunkId || ''));
    if (!foundChunk) reasons.push(`Expected one of chunks ${JSON.stringify(check.expectedTopKChunkIds)} in top-k.`);
    return { passed: reasons.length === 0, reasons };
  }

  for (const check of naturalLanguageCases) {
    console.log(`📖 Natural Case: ${check.caseId} ("${check.query}")`);
    const result = await embedding.retrieve({
      text: check.query,
      filters: { source: 'Upanishads' },
      topK: 5
    });

    const refs = result.documents.map(d => `${d.metadata?.docId}_${d.metadata?.chunkId} (${d.score?.toFixed(2) || 'N/A'})`);
    console.log(`   [Sparse]  Provider: ${result.provider}`);
    console.log(`             Retrieved: ${refs.join(', ') || 'NONE'}`);

    if (result.provider !== 'embedding-index') {
      console.error(`   ❌ FAILED: Natural-language case must use embedding-index, got ${result.provider}.`);
      failed = true;
    }

    const sparseNatural = checkNaturalCase(result.documents as any[], check);
    for (const r of sparseNatural.reasons) console.error(`   ❌ FAILED [sparse]: ${r}`);
    if (!sparseNatural.passed) failed = true;

    let denseRefs: string[] = [];
    let denseProvider = 'n/a';
    if (dense) {
      denseTotal++;
      const resDense = await dense.retrieve({ text: check.query, filters: { source: 'Upanishads' }, topK: 5 });
      denseRefs = resDense.documents.map(d => `${d.metadata?.docId}_${d.metadata?.chunkId} (${d.score?.toFixed(2) || 'N/A'})`);
      denseProvider = resDense.provider ?? 'fallback';
      console.log(`   [Dense]   Provider: ${denseProvider}`);
      console.log(`             Retrieved: ${denseRefs.join(', ') || 'NONE'}`);

      const denseNatural = checkNaturalCase(resDense.documents as any[], check);
      if (denseNatural.passed) {
        densePassed++;
      } else {
        denseFailed = true;
        for (const r of denseNatural.reasons) console.log(`   ⚠️  dense mismatch: ${r}`);
      }
    }

    reportRows.push(`| ${check.caseId} | ${check.query.replace(/\|/g, '\\|')} | ${result.provider ?? 'fallback'} | ${refs.join('<br>') || 'NONE'} | ${denseProvider} | ${denseRefs.join('<br>') || 'NONE'} |`);

    console.log('--------------------------------------------------------------------------------');
  }

  const report = [
    '# Upanishads Retrieval Comparison Report',
    '',
    'Generated by `scripts/compare_upanishads_retrieval.ts`.',
    '',
    'This report includes explicit eval assertions and natural-language assertions without title/doc_id filters.',
    dense
      ? `Dense retriever: ${densePassed}/${denseTotal} cases passed strict assertions (informational only -- not yet registered under a live corpus key).`
      : 'Dense index not found -- dense columns are empty. Run `npx tsx scripts/build-dense-embeddings.mts` first.',
    '',
    '| Case ID | Query | Sparse Provider | Sparse Retrieved | Dense Provider | Dense Retrieved |',
    '|---|---|---|---|---|---|',
    ...reportRows,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(process.cwd(), 'upanishads_retrieval_comparison.md'), report, 'utf-8');

  if (dense) {
    console.log(`\n📊 Dense retriever: ${densePassed}/${denseTotal} cases passed strict assertions${denseFailed ? ' (informational -- not gating exit code)' : ''}.`);
  }

  if (failed) {
    console.error('❌ Eval Script Failed due to one or more strict assertions!');
    process.exit(1);
  } else {
    console.log('✅ All eval cases passed strict assertions!');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
