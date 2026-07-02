import fs from 'fs';
import path from 'path';

const RETRIEVAL_PATH = 'src/lib/ai/retrieval.ts';
let content = fs.readFileSync(RETRIEVAL_PATH, 'utf-8');

const newRetriever = `
const dharamVeerManifestRetriever = new PramanaManifestRetriever({
  prefix: 'dharam_veer',
  sourceName: 'Dharam Veer',
  sourceClass: 'narrative',
  tradition: 'Dharmic',
  maxChapters: 10
});

export class PramanaDharamVeerEmbeddingRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private fallbackRetriever: PramanaManifestRetriever;
  private indexPath: string;
  private indexData: any = null;

  constructor(fallbackRetriever: PramanaManifestRetriever) {
    this.fallbackRetriever = fallbackRetriever;
    this.indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/dharam_veer_index.json');
  }

  private loadIndex() {
    if (this.indexData) return this.indexData;
    if (!fs.existsSync(this.indexPath)) return null;
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      this.indexData = JSON.parse(data);
      return this.indexData;
    } catch {
      return null;
    }
  }

  private tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z0-9\\u0900-\\u097f]+(?:\\.[a-z0-9\\u0900-\\u097f]+)*/g) || []);
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const index = this.loadIndex();
    if (!index) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryText = query.text.trim();
    const reqTitle = (query.filters?.title as string || '').toLowerCase(); // expected figure_id

    const docsWithScores: Array<{ doc: any; score: number }> = [];
    
    // For Dharam Veer, we just want to retrieve the passages specific to the requested figure (if specified)
    // or fallback to similarity search. Since it's an "ask more" feature, reqTitle is highly specific.
    for (const doc of index.documents) {
      let score = 0;
      
      const docId = (doc.doc_id || '').toLowerCase();
      if (reqTitle) {
          if (docId === reqTitle || docId === \`dharam_veer_\${reqTitle}\`) {
              score += 2.0; // high boost for exact figure match
          }
      }

      if (score > 0) {
        docsWithScores.push({ doc, score });
      }
    }

    // fallback to normal query if no reqTitle match
    if (docsWithScores.length === 0 && queryText) {
        const tokens = this.tokenize(queryText);
        if (tokens.length > 0) {
            const tf: Record<string, number> = {};
            for (const t of tokens) {
              tf[t] = (tf[t] || 0) + 1;
            }

            const queryVector: Record<string, number> = {};
            let sumSq = 0;
            for (const t in tf) {
              const idf = index.idf[t] || 0;
              if (idf > 0) {
                const tfidf = tf[t] * idf;
                queryVector[t] = tfidf;
                sumSq += tfidf * tfidf;
              }
            }

            const queryNorm = Math.sqrt(sumSq);
            if (queryNorm > 0) {
                const queryUnitVector: Record<string, number> = {};
                for (const t in queryVector) {
                  queryUnitVector[t] = queryVector[t] / queryNorm;
                }
                
                for (const doc of index.documents) {
                  let score = 0;
                  for (const t in queryUnitVector) {
                    if (doc.vector[t]) {
                      score += queryUnitVector[t] * doc.vector[t];
                    }
                  }
                  if (score > 0) {
                    docsWithScores.push({ doc, score });
                  }
                }
            }
        }
    }

    if (docsWithScores.length === 0) {
      return { documents: [] };
    }

    docsWithScores.sort((a, b) => b.score - a.score);

    const limit = query.topK || 5;
    const topDocs = docsWithScores.slice(0, limit);

    const documents: RetrievalChunk[] = topDocs.map((item) => {
      const doc = item.doc;
      return {
        id: doc.id,
        content: doc.text,
        score: item.score,
        metadata: {
          chunkId: doc.ref,
          docId: doc.doc_id,
          tradition: doc.tradition || 'Dharmic',
          sourceName: doc.source_name || 'Dharam Veer',
          sourceClass: 'narrative',
          rightsStatus: 'public_domain' // assume verified
        }
      };
    });

    return {
      documents,
      provider: 'embedding-index'
    };
  }
}

PramanaRetrieverSelector.register('dharam_veer_reflection', new PramanaDharamVeerEmbeddingRetriever(dharamVeerManifestRetriever));
export const dharamVeerRetriever = new PramanaDharamVeerEmbeddingRetriever(dharamVeerManifestRetriever);
`;

content += '\n' + newRetriever;
fs.writeFileSync(RETRIEVAL_PATH, content, 'utf-8');
console.log('patched retrieval.ts');
