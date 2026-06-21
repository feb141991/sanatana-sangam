import fs from 'fs';
import path from 'path';
import { PramanaManifestRetriever, PramanaGenericEmbeddingRetriever } from '../src/lib/ai/retrieval';

async function main() {
  const datasetPath = path.join(process.cwd(), 'python/ai_pipeline/datasets/evals/pathshala_ramayana.sample.jsonl');
  const indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/ramayana_index.json');
  if (!fs.existsSync(datasetPath) || !fs.existsSync(indexPath)) {
    console.error('Dataset or Index not found');
    process.exit(1);
  }

  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const lines = fs.readFileSync(datasetPath, 'utf-8').split('\n').filter(Boolean);
  const cases = lines.map(l => JSON.parse(l));

  const ramayanaManifestRetriever = new PramanaManifestRetriever({
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

  const embedding = new PramanaGenericEmbeddingRetriever(
    ramayanaManifestRetriever,
    indexPath,
    'Sanatana Dharma',
    'Valmiki Ramayana'
  );

  console.log('================================================================================');
  console.log('📊 STRICT EVALUATION: EMBEDDING-BACKED (RAMAYANA)');
  console.log('================================================================================\n');

  let failed = false;

  for (const c of cases) {
    const chunkId = c.prompt.chunk_id;
    const docId = c.prompt.doc_id;
    const queryText = c.prompt.query ? c.prompt.query : `${docId || 'Ramayana'} ${chunkId || ''}`.trim();
    const mustCiteDocs = c.expected?.must_cite_doc_ids || [];

    const rawTokens = queryText.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || [];
    const hasTokens = rawTokens.some((t: string) => indexData.idf[t] > 0);

    console.log(`📖 Eval Case: ${c.case_id} ("${queryText}")`);

    const resEmbed = await embedding.retrieve({
      text: queryText,
      filters: { source: 'Valmiki Ramayana', title: docId }
    });

    const embedRefs = resEmbed.documents.map(d => `${d.metadata?.docId}_${d.metadata?.chunkId} (${d.score?.toFixed(2) || 'N/A'})`);
    console.log(`   [Embedding] Provider: ${resEmbed.provider}`);
    console.log(`               Retrieved: ${embedRefs.join(', ') || 'NONE'}`);

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
