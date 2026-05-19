export type RetrievalChunk = {
  chunkId: string;
  docId: string;
  text: string;
  tradition?: string | null;
  sourceName?: string | null;
  sourceClass?: string | null;
  rightsStatus?: string | null;
};

export async function retrievePathshalaContext(_input: {
  source?: string;
  title?: string;
  tradition?: string | null;
}): Promise<RetrievalChunk[]> {
  // Phase 1 foundation only. Real retrieval will be backed by the private
  // corpus + embeddings pipeline later.
  return [];
}
