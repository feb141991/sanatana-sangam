export interface LanguageTag {
  code: string;
  label?: string;
  script?: string;
  region?: string;
  confidence?: number;
  isPrimary?: boolean;
}

export interface TraditionTag {
  slug: string;
  label: string;
  lineage?: string;
  school?: string;
  confidence?: number;
}

export interface TopicTag {
  slug: string;
  label: string;
  confidence?: number;
}

export interface CorpusTagSet {
  languages?: LanguageTag[];
  traditions?: TraditionTag[];
  topics?: TopicTag[];
  keywords?: string[];
}
