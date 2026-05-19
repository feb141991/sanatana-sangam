import fs from 'fs';
import path from 'path';
import { PramanaManifestRetriever, PramanaGitaEmbeddingRetriever } from '../src/lib/ai/retrieval';

async function main() {
  const datasetPath = path.join(process.cwd(), 'python/ai_pipeline/datasets/evals/pathshala_explain.sample.jsonl');
  if (!fs.existsSync(datasetPath)) {
    console.error('Dataset not found at', datasetPath);
    return;
  }

  const lines = fs.readFileSync(datasetPath, 'utf-8').split('\n').filter(Boolean);
  const cases = lines.map(l => JSON.parse(l));

  const heuristic = new PramanaManifestRetriever({
    prefix: 'gita_chapter',
    sourceName: 'Bhagavad Gita',
    sourceClass: 'scripture',
    tradition: 'Sanatana Dharma',
    maxChapters: 18
  });

  const embedding = new PramanaGitaEmbeddingRetriever(heuristic);

  console.log('================================================================================');
  console.log('📊 RETRIEVAL ADAPTER COMPARISON REPORT: HEURISTIC VS EMBEDDING-BACKED');
  console.log('================================================================================\n');

  for (const c of cases) {
    const chunkId = c.prompt.chunk_id;
    const docId = c.prompt.doc_id;
    // Construct query representation
    const queryText = `Bhagavad Gita ${chunkId}`;

    console.log(`📖 Eval Case: ${c.case_id} (${queryText})`);

    // 1. Run Heuristic Retrieval
    const startHeur = Date.now();
    const resHeur = await heuristic.retrieve({
      text: queryText,
      filters: { source: 'Bhagavad Gita', title: docId }
    });
    const latHeur = Date.now() - startHeur;
    const heurRefs = resHeur.documents.map(d => `${d.metadata?.chunkId} (Score: ${d.score?.toFixed(2) || 'N/A'})`);

    // 2. Run Embedding-Backed Retrieval
    const startEmbed = Date.now();
    const resEmbed = await embedding.retrieve({
      text: queryText,
      filters: { source: 'Bhagavad Gita', title: docId }
    });
    const latEmbed = Date.now() - startEmbed;
    const embedRefs = resEmbed.documents.map(d => `${d.metadata?.chunkId} (Score: ${d.score?.toFixed(2) || 'N/A'})`);

    console.log(`   [Heuristic] Latency: ${latHeur}ms`);
    console.log(`               Retrieved: ${heurRefs.join(', ')}`);
    console.log(`   [Embedding] Latency: ${embedEmbed(latEmbed)}ms (Provider: ${resEmbed.provider})`);
    console.log(`               Retrieved: ${embedRefs.join(', ')}`);
    console.log('--------------------------------------------------------------------------------');
  }
}

function embedEmbed(ms: number) {
  return `${ms}`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
