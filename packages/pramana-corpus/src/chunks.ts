import type { ChunkKind } from "./enums.js";
import type { CorpusTagSet } from "./tagging.js";

export interface ChunkPosition {
  index: number;
  startOffset?: number;
  endOffset?: number;
}

export interface ChunkReference {
  documentId: string;
  chunkId: string;
  canonicalRef?: string;
  parentChunkId?: string;
}

export interface CorpusChunk {
  id: string;
  documentId: string;
  kind: ChunkKind;
  text: string;
  normalizedText?: string;
  transliteration?: string;
  translation?: string;
  summary?: string;
  position: ChunkPosition;
  ref?: ChunkReference;
  tags?: CorpusTagSet;
  embeddingKey?: string;
  tokenCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
