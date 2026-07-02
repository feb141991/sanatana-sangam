import fs from 'fs';
import path from 'path';
import { PramanaManifestRetriever, PramanaUpanishadsEmbeddingRetriever } from '../src/lib/ai/retrieval';

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

  console.log('================================================================================');
  console.log('📊 STRICT EVALUATION: HEURISTIC VS EMBEDDING-BACKED (UPANISHADS)');
  console.log('================================================================================\n');

  let failed = false;
  const reportRows: string[] = [];

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
    console.log(`   [Embedding] Provider: ${resEmbed.provider}`);
    console.log(`               Retrieved: ${embedRefs.join(', ') || 'NONE'}`);
    reportRows.push(`| ${c.case_id} | ${queryText.replace(/\|/g, '\\|')} | ${resEmbed.provider ?? 'fallback'} | ${embedRefs.join('<br>') || 'NONE'} |`);

    if (resEmbed.documents.length === 0) {
      console.error(`   ❌ FAILED: No documents returned.`);
      failed = true;
      continue;
    }

    if (hasTokens && resEmbed.provider !== 'embedding-index') {
      console.error(`   ❌ FAILED: Provider must be embedding-index, got ${resEmbed.provider}. Fallback used despite tokens existing!`);
      failed = true;
    }

    if (mustCiteDocs.length > 0) {
      const top1DocId = resEmbed.documents[0].metadata?.docId;
      if (!mustCiteDocs.includes(top1DocId)) {
        console.error(`   ❌ FAILED: Expected doc ID from ${JSON.stringify(mustCiteDocs)} to be top-1, but got ${top1DocId}`);
        failed = true;
      }
      
      const foundAny = resEmbed.documents.some(d => mustCiteDocs.includes(d.metadata?.docId));
      if (!foundAny) {
        console.error(`   ❌ FAILED: Expected doc ID not in top-k results.`);
        failed = true;
      }
    }

    if (chunkId) {
      const foundChunk = resEmbed.documents.some(d => d.metadata?.chunkId === chunkId && d.metadata?.docId === docId);
      if (!foundChunk) {
        console.error(`   ❌ FAILED: Expected specific chunk ${docId}_${chunkId} was not retrieved.`);
        failed = true;
      }
    }

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

  for (const check of naturalLanguageCases) {
    console.log(`📖 Natural Case: ${check.caseId} ("${check.query}")`);
    const result = await embedding.retrieve({
      text: check.query,
      filters: { source: 'Upanishads' },
      topK: 5
    });

    const refs = result.documents.map(d => `${d.metadata?.docId}_${d.metadata?.chunkId} (${d.score?.toFixed(2) || 'N/A'})`);
    console.log(`   [Embedding] Provider: ${result.provider}`);
    console.log(`               Retrieved: ${refs.join(', ') || 'NONE'}`);
    reportRows.push(`| ${check.caseId} | ${check.query.replace(/\|/g, '\\|')} | ${result.provider ?? 'fallback'} | ${refs.join('<br>') || 'NONE'} |`);

    if (result.provider !== 'embedding-index') {
      console.error(`   ❌ FAILED: Natural-language case must use embedding-index, got ${result.provider}.`);
      failed = true;
    }
    if (result.documents.length === 0) {
      console.error('   ❌ FAILED: No documents returned.');
      failed = true;
      continue;
    }

    const top1DocId = result.documents[0].metadata?.docId;
    if ('expectedTop1DocId' in check && check.expectedTop1DocId && top1DocId !== check.expectedTop1DocId) {
      console.error(`   ❌ FAILED: Expected top-1 doc ${check.expectedTop1DocId}, got ${top1DocId}.`);
      failed = true;
    }

    if ('expectedTopKDocIds' in check && check.expectedTopKDocIds?.length) {
      const foundDoc = result.documents.some(d => check.expectedTopKDocIds.includes(d.metadata?.docId || ''));
      if (!foundDoc) {
        console.error(`   ❌ FAILED: Expected one of ${JSON.stringify(check.expectedTopKDocIds)} in top-k.`);
        failed = true;
      }
    }

    const foundChunk = result.documents.some(d => check.expectedTopKChunkIds.includes(d.metadata?.chunkId || ''));
    if (!foundChunk) {
      console.error(`   ❌ FAILED: Expected one of chunks ${JSON.stringify(check.expectedTopKChunkIds)} in top-k.`);
      failed = true;
    }

    console.log('--------------------------------------------------------------------------------');
  }

  const report = [
    '# Upanishads Retrieval Comparison Report',
    '',
    'Generated by `scripts/compare_upanishads_retrieval.ts`.',
    '',
    'This report includes explicit eval assertions and natural-language assertions without title/doc_id filters.',
    '',
    '| Case ID | Query | Provider | Retrieved |',
    '|---|---|---|---|',
    ...reportRows,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(process.cwd(), 'upanishads_retrieval_comparison.md'), report, 'utf-8');

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
