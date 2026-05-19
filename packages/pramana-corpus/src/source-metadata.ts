import type { RightsStatus, SourceClass } from "./enums.js";
import type { CorpusTagSet } from "./tagging.js";

export interface SourceLocator {
  uri?: string;
  isbn?: string;
  doi?: string;
  shelfmark?: string;
  archiveId?: string;
}

export interface SourceAttribution {
  author?: string;
  editor?: string;
  translator?: string;
  compiler?: string;
  publisher?: string;
  publicationYear?: number;
  edition?: string;
}

export interface RightsMetadata {
  status: RightsStatus;
  statement?: string;
  licenseName?: string;
  licenseUrl?: string;
  copyrightHolder?: string;
}

export interface SourceMetadata {
  sourceId: string;
  title: string;
  shortTitle?: string;
  sourceClass: SourceClass;
  canonicalCitation?: string;
  collection?: string;
  attribution?: SourceAttribution;
  locator?: SourceLocator;
  rights: RightsMetadata;
  tags?: CorpusTagSet;
  notes?: string[];
}
