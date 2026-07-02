import fs from 'fs';
import path from 'path';
import { retrievePathshalaContext } from '../src/lib/ai/retrieval';

async function main() {
  const indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/valmiki_ramayana_index.json');
  if (!fs.existsSync(indexPath)) {
    console.error('Valmiki Ramayana index not found.');
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  const documentCount = index.metadata?.document_count ?? index.documents?.length ?? 0;
  if (documentCount === 0 && (index.documents?.length ?? 0) === 0) {
    console.error('FAILED: valmiki_ramayana index is empty.');
    process.exit(1);
  }

  if (index.metadata?.is_live_in_app !== true) {
    console.error('FAILED: valmiki_ramayana index must declare is_live_in_app=true.');
    process.exit(1);
  }
  if (index.metadata?.activation_status !== 'explicit_only') {
    console.error('FAILED: valmiki_ramayana index must declare activation_status=explicit_only.');
    process.exit(1);
  }
  if (index.metadata?.source_class !== 'curated_lesson') {
    console.error('FAILED: valmiki_ramayana index must declare source_class=curated_lesson until source audit clears.');
    process.exit(1);
  }
  if (index.metadata?.rights_status !== 'restricted_or_pending') {
    console.error('FAILED: valmiki_ramayana index must declare rights_status=restricted_or_pending until source audit clears.');
    process.exit(1);
  }
  if (index.metadata?.review_status !== 'needs_source_audit') {
    console.error('FAILED: valmiki_ramayana index must declare review_status=needs_source_audit.');
    process.exit(1);
  }

  // Generic query test
  const genericRes = await retrievePathshalaContext({
    title: 'what is hindu dharma',
  });
  if (genericRes.length > 0 && genericRes[0].metadata?.sourceName === 'Valmiki Ramayana') {
    console.error('FAILED: Generic query routed to Valmiki Ramayana incorrectly.');
    process.exit(1);
  }

  // Specific query test
  const specificRes = await retrievePathshalaContext({
    title: 'valmiki ramayana bala kanda 1.1.1',
    corpus: 'valmiki_ramayana',
  });

  if (specificRes.length === 0) {
    console.error('FAILED: valmiki_ramayana retrieval returned 0 documents.');
    process.exit(1);
  }

  const topDoc = specificRes[0];
  if (topDoc.metadata?.docId !== 'valmiki_ramayana_bala') {
    console.error(`FAILED: Top-1 docId is ${topDoc.metadata?.docId}, expected valmiki_ramayana_bala`);
    process.exit(1);
  }

  if (topDoc.metadata?.chunkId !== '1.1.1') {
    console.error(`FAILED: Expected chunk 1.1.1, got ${topDoc.metadata?.chunkId}`);
    process.exit(1);
  }

  if (topDoc.metadata?.sourceClass !== 'curated_lesson') {
    console.error(`FAILED: Expected sourceClass=curated_lesson, got ${topDoc.metadata?.sourceClass}`);
    process.exit(1);
  }

  if (topDoc.metadata?.rightsStatus !== 'restricted_or_pending') {
    console.error(`FAILED: Expected rightsStatus=restricted_or_pending, got ${topDoc.metadata?.rightsStatus}`);
    process.exit(1);
  }

  console.log('Valmiki Ramayana retrieval passed: explicit routing works with source-audit pending metadata.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
