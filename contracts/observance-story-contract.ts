export type ObservanceStoryLanguage = 'en' | 'hi' | 'pa';
export type ObservanceStoryStatus = 'draft' | 'needs_review' | 'approved' | 'published' | 'rejected' | 'archived';
export type ObservanceArtworkKind = 'card' | 'reader_hero' | 'share';
export type ObservanceShareAudience = 'sibling' | 'family' | 'teacher' | 'community' | 'friend' | 'neutral';

export interface ObservanceSourceReference {
  id: string;
  title: string;
  author: string | null;
  url: string;
  citation: string;
  tier: 1 | 2 | 3 | 4 | 5;
  rightsStatus: 'public_domain' | 'licensed' | 'rights_cleared' | 'citation_only';
  excerpt: string;
  language: string;
}

export interface ObservanceStoryVerse {
  original: string;
  transliteration: string | null;
  translation: string;
  sourceId: string;
}

export interface ObservanceStoryTranslation {
  language: ObservanceStoryLanguage;
  teaser: string;
  origin: string;
  significance: string;
  rituals: string[];
  verse: ObservanceStoryVerse | null;
  personalPractice: string;
}

export interface ObservanceArtworkAsset {
  id: string;
  kind: ObservanceArtworkKind;
  uri: string;
  width: number;
  height: number;
  focalPoint: { x: number; y: number };
  altText: Partial<Record<ObservanceStoryLanguage, string>>;
  version: number;
}

export interface ObservanceShareTemplate {
  language: ObservanceStoryLanguage;
  audience: ObservanceShareAudience;
  cta: string;
  title: string;
  message: string;
}

export interface PublishedObservanceStory {
  storyId: string;
  observanceSlug: string;
  displayName: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  contentVersion: number;
  status: 'published';
  translation: ObservanceStoryTranslation;
  sources: ObservanceSourceReference[];
  artwork: ObservanceArtworkAsset[];
  shareTemplate: ObservanceShareTemplate;
  publishedAt: string;
}

export interface HomeObservanceStoryCard {
  identityKey: string;
  civilDate: string;
  daysLeft: number;
  story: PublishedObservanceStory;
}
