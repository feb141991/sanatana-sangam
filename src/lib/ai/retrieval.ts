import type { PramanaRetrievalDocument, PramanaRetriever, PramanaRetrievalQuery, PramanaRetrievalResult } from '@sangam/pramana-serve';

export type RetrievalChunkMetadata = {
  chunkId: string;
  docId: string;
  tradition?: string | null;
  sourceName?: string | null;
  sourceClass?: string | null;
  rightsStatus?: string | null;
};

export type RetrievalChunk = PramanaRetrievalDocument<RetrievalChunkMetadata>;

export class MockPathshalaRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    // Phase 1 foundation only. Real retrieval will be backed by the private
    // corpus + embeddings pipeline later.
    return {
      documents: []
    };
  }
}

export async function retrievePathshalaContext(input: {
  source?: string;
  title?: string;
  tradition?: string | null;
}): Promise<RetrievalChunk[]> {
  const retriever = new MockPathshalaRetriever();
  const res = await retriever.retrieve({
    text: `${input.title ?? ''} ${input.source ?? ''} ${input.tradition ?? ''}`.trim(),
  });
  return res.documents as RetrievalChunk[];
}
