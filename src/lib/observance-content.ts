import { createAdminClient } from '@/lib/supabase-admin';
import type {
  HomeObservanceStoryCard,
  ObservanceShareAudience,
  ObservanceStoryLanguage,
  PublishedObservanceStory,
} from '../../contracts/observance-story-contract';
import type { ClientObservanceResult } from './calendar/observance-formatter';

const REQUIRED_LANGUAGES: ObservanceStoryLanguage[] = ['en', 'hi', 'pa'];

function preferredAudience(slug: string): ObservanceShareAudience {
  if (slug === 'raksha-bandhan' || slug === 'bhai-dooj') return 'sibling';
  if (slug === 'guru-purnima' || slug.includes('gurpurab')) return 'teacher';
  if (slug.includes('diwali') || slug.includes('new-year') || slug === 'holi') return 'family';
  if (slug.includes('ekadashi') || slug.includes('purnima') || slug.includes('amavasya')) return 'community';
  return 'neutral';
}

type TranslationRow = {
  language: ObservanceStoryLanguage;
  teaser: string;
  origin: string;
  significance: string;
  rituals: unknown;
  verse: unknown;
  personal_practice: string;
  review_status: string;
};

export async function getPublishedObservanceStoryCards(
  observances: ClientObservanceResult[],
  language: ObservanceStoryLanguage,
  spiritualDate: string,
): Promise<HomeObservanceStoryCard[]> {
  const slugs = [...new Set(observances.map((item) => item.slug))];
  if (slugs.length === 0) return [];

  const db = createAdminClient() as any;
  const { data: versions, error: versionError } = await db
    .from('observance_story_versions')
    .select(`
      id,
      definition_id,
      version,
      status,
      published_at,
      observance_definitions!inner(slug, display_name, tradition),
      observance_story_translations(*),
      observance_story_source_links(source_id, observance_content_sources(*)),
      observance_artwork(*),
      observance_share_templates(*)
    `)
    .in('observance_definitions.slug', slugs)
    .eq('status', 'published');
  // Migration may be committed but not yet applied. Readers fail closed.
  if (versionError || !versions?.length) return [];

  const versionBySlug = new Map(versions.map((row: any) => [row.observance_definitions.slug, row]));

  return observances.flatMap((occurrence) => {
    const version: any = versionBySlug.get(occurrence.slug);
    if (!version || !occurrence.civilDate) return [];

    const versionTranslations = (version.observance_story_translations ?? []).filter((row: any) => row.review_status === 'approved') as TranslationRow[];
    const translation = versionTranslations.find((row) => row.language === language)
      ?? versionTranslations.find((row) => row.language === 'en');
    if (!translation || !REQUIRED_LANGUAGES.every((lang) => versionTranslations.some((row) => row.language === lang))) return [];

    const sources = (version.observance_story_source_links ?? [])
      .map((row: any) => row.observance_content_sources)
      .filter((row: any) => row?.approved)
      .map((row: any) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        url: row.source_url,
        citation: row.citation,
        tier: row.source_tier,
        rightsStatus: row.rights_status,
        excerpt: row.excerpt,
        language: row.language,
      }));
    if (sources.length === 0) return [];

    const preferred = preferredAudience(occurrence.slug);
    const templates = (version.observance_share_templates ?? []).filter(
      (row: any) => row.review_status === 'approved' && row.language === translation.language,
    );
    const share = templates.find((row: any) => row.audience === preferred)
      ?? templates.find((row: any) => row.audience === 'neutral');
    if (!share) return [];

    const story: PublishedObservanceStory = {
      storyId: version.id,
      observanceSlug: occurrence.slug,
      displayName: version.observance_definitions.display_name,
      tradition: version.observance_definitions.tradition ?? 'all',
      contentVersion: version.version,
      status: 'published',
      translation: {
        language: translation.language,
        teaser: translation.teaser,
        origin: translation.origin,
        significance: translation.significance,
        rituals: Array.isArray(translation.rituals) ? translation.rituals.filter((item): item is string => typeof item === 'string') : [],
        verse: translation.verse as any,
        personalPractice: translation.personal_practice,
      },
      sources,
      artwork: (version.observance_artwork ?? []).filter((row: any) => row.review_status === 'approved').map((row: any) => ({
        id: row.id,
        kind: row.kind,
        uri: row.uri,
        width: row.width,
        height: row.height,
        focalPoint: { x: Number(row.focal_x), y: Number(row.focal_y) },
        altText: row.alt_text ?? {},
        version: row.version,
      })),
      shareTemplate: {
        language: share.language,
        audience: share.audience,
        cta: share.cta,
        title: share.title,
        message: share.message,
      },
      publishedAt: version.published_at,
    };

    const daysLeft = Math.round((Date.parse(`${occurrence.civilDate}T00:00:00Z`) - Date.parse(`${spiritualDate}T00:00:00Z`)) / 86_400_000);
    return [{ identityKey: `${occurrence.slug}:${occurrence.civilDate}`, civilDate: occurrence.civilDate, daysLeft, story }];
  });
}
