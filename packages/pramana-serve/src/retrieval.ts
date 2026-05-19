export interface PramanaRetrievalDocument<TMetadata = Record<string, unknown>> {
  readonly id: string;
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
