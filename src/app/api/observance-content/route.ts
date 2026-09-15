import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'slug parameter is required' }, { status: 400 });
  }

  const db = createAdminClient() as any;

  const { data: def, error: defError } = await db
    .from('observance_definitions')
    .select('id, slug, display_name, tradition')
    .eq('slug', slug)
    .maybeSingle();

  if (defError || !def) {
    return NextResponse.json({ published: false, error: 'Observance not found' }, { status: 404 });
  }

  const { data: version, error: versionError } = await db
    .from('observance_story_versions')
    .select(`
      id,
      version,
      status,
      published_at,
      observance_story_translations(*)
    `)
    .eq('definition_id', def.id)
    .eq('status', 'published')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError || !version) {
    // Also check if there is an approved version
    const { data: approvedVersion } = await db
      .from('observance_story_versions')
      .select(`
        id,
        version,
        status,
        published_at,
        observance_story_translations(*)
      `)
      .eq('definition_id', def.id)
      .eq('status', 'approved')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!approvedVersion) {
      return NextResponse.json({ published: false, slug }, { status: 200 });
    }

    const translationsMap: Record<string, any> = {};
    for (const t of (approvedVersion.observance_story_translations || [])) {
      translationsMap[t.language] = {
        teaser: t.teaser,
        origin: t.origin,
        significance: t.significance,
        rituals: t.rituals || [],
        verse: t.verse,
        personalPractice: t.personal_practice,
        reviewStatus: t.review_status,
      };
    }

    return NextResponse.json({
      published: true,
      status: 'approved',
      story: {
        id: approvedVersion.id,
        definitionId: def.id,
        slug: def.slug,
        displayName: def.display_name,
        tradition: def.tradition,
        version: approvedVersion.version,
        translations: translationsMap,
      },
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  const translationsMap: Record<string, any> = {};
  for (const t of (version.observance_story_translations || [])) {
    translationsMap[t.language] = {
      teaser: t.teaser,
      origin: t.origin,
      significance: t.significance,
      rituals: t.rituals || [],
      verse: t.verse,
      personalPractice: t.personal_practice,
      reviewStatus: t.review_status,
    };
  }

  return NextResponse.json({
    published: true,
    status: 'published',
    story: {
      id: version.id,
      definitionId: def.id,
      slug: def.slug,
      displayName: def.display_name,
      tradition: def.tradition,
      version: version.version,
      publishedAt: version.published_at,
      translations: translationsMap,
    },
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
