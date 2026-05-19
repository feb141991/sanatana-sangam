import type { DocumentStatus } from "./enums.js";
import type { SourceMetadata } from "./source-metadata.js";
import type { CorpusTagSet } from "./tagging.js";

export interface DocumentSpan {
  start?: number;
  end?: number;
  label?: string;
}

export interface DocumentProvenance {
  importedAt?: string;
  importedBy?: string;
  checksum?: string;
  ingestionPipeline?: string;
  revision?: string;
}

export interface CorpusDocument {
  id: string;
  slug: string;
  title: string;
  alternateTitles?: string[];
  summary?: string;
  status: DocumentStatus;
  source: SourceMetadata;
  tags?: CorpusTagSet;
  availableLanguages?: string[];
  canonicalRef?: string;
  structurePath?: string[];
  spans?: DocumentSpan[];
  provenance?: DocumentProvenance;
  createdAt?: string;
  updatedAt?: string;
}
