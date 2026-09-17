export interface PramanaRetrievalDocument<TMetadata = Record<string, unknown>> {
  readonly id?: string;
  readonly content: string;
  readonly score?: number;
  readonly metadata?: TMetadata;
}

export interface PramanaRetrievalQuery {
  readonly text: string;
  readonly topK?: number;
  readonly filters?: Readonly<Record<string, unknown>>;
  readonly namespace?: string;
}

export interface PramanaRetrievalResult<TMetadata = Record<string, unknown>> {
  readonly documents: readonly PramanaRetrievalDocument<TMetadata>[];
  readonly latencyMs?: number;
  readonly provider?: string;
}

export interface PramanaRetriever<TMetadata = Record<string, unknown>> {
  retrieve(
    query: PramanaRetrievalQuery
  ): Promise<PramanaRetrievalResult<TMetadata>> | PramanaRetrievalResult<TMetadata>;
}

export type PramanaCorpusTarget =
  | 'pathshala_gita'
  | 'pathshala_upanishads'
  | 'bhakti_katha'
  | 'bhakti_panchatantra';

export class PramanaRetrieverSelector {
  private static retrievers = new Map<string, PramanaRetriever<any>>();

  public static register(corpus: string, retriever: PramanaRetriever<any>): void {
    this.retrievers.set(corpus, retriever);
  }

  public static get(corpus: string): PramanaRetriever<any> | undefined {
    return this.retrievers.get(corpus);
  }

  public static select(corpus: string): PramanaRetriever<any> {
    const retriever = this.get(corpus);
    if (!retriever) {
      throw new Error(`No PramanaRetriever registered for corpus target: ${corpus}`);
    }
    return retriever;
  }

  public static clear(): void {
    this.retrievers.clear();
  }
}

export interface PramanaContextSerializerOptions {
  includeScores?: boolean;
  prefix?: string;
  suffix?: string;
}

/**
 * True when any retrieved document's rights status is source-audit-pending
 * (or the document simply has no rights status at all -- the same code path
 * that let Buddhist/Jain documents fall through to retrieval.ts's
 * 'public_domain' default without this ever tripping). Prompt builders that
 * skip this check present unverified content as if it were approved canon --
 * this is the one place that decision is made, so every builder shares it
 * rather than re-deriving (or forgetting) it per corpus.
 */
export function hasPendingSourceContent(
  documents: readonly PramanaRetrievalDocument<any>[]
): boolean {
  return documents.some((doc) => {
    const status = doc.metadata?.rightsStatus;
    return !status || status === 'restricted_or_pending';
  });
}

export function buildPendingSourceNotice(corpusLabel: string): string {
  return [
    '=== SOURCE-AUDIT-PENDING STUDY MATERIAL ===',
    `The following explicitly requested Shoonaya study material (${corpusLabel}) has not yet been approved as canonical Pramana. Its source or rights audit remains pending:`,
  ].join('\n');
}

export const PENDING_SOURCE_INSTRUCTIONS =
  'Use this only as clearly labelled study context. Paraphrase with attribution to Shoonaya study notes; do not present it as a verified canonical quotation or imply source approval. State that source verification is pending. Do not invent quotations or claims beyond this material.';

export function serializePramanaContext(
  documents: readonly PramanaRetrievalDocument<any>[],
  options?: PramanaContextSerializerOptions
): string {
  if (!documents.length) return '';
  const prefix = options?.prefix ?? '=== RETRIEVED CONTEXT PASSAGES (GROUNDING SOURCE DATA) ===\n';
  const suffix = options?.suffix ?? '\n=========================================================';
  
  const serialized = documents.map((doc, idx) => {
    const meta = doc.metadata || {};
    const sourceName = meta.sourceName || meta.docId || 'Unknown Source';
    const chunkId = meta.chunkId ? ` (Ref: ${meta.chunkId})` : '';
    const scoreStr = options?.includeScores && doc.score !== undefined ? ` [Score: ${doc.score.toFixed(2)}]` : '';
    return `[Passage ${idx + 1}]${scoreStr}\nSource: ${sourceName}${chunkId}\nContent:\n${doc.content}`;
  }).join('\n\n');

  return `${prefix}${serialized}${suffix}`;
}

