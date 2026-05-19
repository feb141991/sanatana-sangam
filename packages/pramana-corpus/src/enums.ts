export const SOURCE_CLASS_VALUES = [
  "primary",
  "commentary",
  "translation",
  "lexicon",
  "catalog",
  "secondary",
  "reference"
] as const;

export type SourceClass = (typeof SOURCE_CLASS_VALUES)[number];

export const RIGHTS_STATUS_VALUES = [
  "public-domain",
  "licensed",
  "restricted",
  "unknown"
] as const;

export type RightsStatus = (typeof RIGHTS_STATUS_VALUES)[number];

export const CHUNK_KIND_VALUES = [
  "passage",
  "verse",
  "prose",
  "commentary",
  "annotation",
  "metadata"
] as const;

export type ChunkKind = (typeof CHUNK_KIND_VALUES)[number];

export const DOCUMENT_STATUS_VALUES = [
  "draft",
  "reviewed",
  "published",
  "archived"
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS_VALUES)[number];
