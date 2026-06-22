import fs from 'fs';
import path from 'path';
import { retrievePathshalaContext } from '../src/lib/ai/retrieval';

async function main() {
  const indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/valmiki_ramayana_index.json');
  if (!fs.existsSync(indexPath)) {
    console.error('Valmiki Ramayana index not found.');
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as {
    metadata?: {
      document_count?: number;
      is_live_in_app?: boolean;
      scale_readiness?: string;
    };
    documents?: unknown[];
  };

  const documentCount = index.metadata?.document_count ?? index.documents?.length ?? 0;
  if (documentCount !== 0 || (index.documents?.length ?? 0) !== 0) {
    console.error('FAILED: valmiki_ramayana index must stay empty until source-audit passes.');
    process.exit(1);
  }

  if (index.metadata?.is_live_in_app !== false) {
    console.error('FAILED: valmiki_ramayana index must declare is_live_in_app=false.');
    process.exit(1);
  }

  try {
    await retrievePathshalaContext({
      title: 'valmiki ramayana bala kanda 1.1.1',
      corpus: 'valmiki_ramayana',
    });
    console.error('FAILED: valmiki_ramayana retrieval unexpectedly succeeded.');
    process.exit(1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('source-audit pending')) {
      console.error(`FAILED: unexpected retrieval error: ${message}`);
      process.exit(1);
    }
  }

  console.log('Valmiki Ramayana retrieval guard passed: corpus is source-audit pending and not active.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
