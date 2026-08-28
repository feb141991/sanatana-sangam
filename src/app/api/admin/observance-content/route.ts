import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export const runtime = 'nodejs';

function audit(db: any, action: string, entityType: string, entityId: string | null, detail: Record<string, unknown>) {
  return db.from('observance_content_audit_log').insert({ action, entity_type: entityType, entity_id: entityId, detail });
}

function parseJson(text: string): any {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const db = createAdminClient() as any;
  const [definitionsResult, versionsResult, sourcesResult, artworkResult, sharesResult, occurrencesResult] = await Promise.all([
    db.from('observance_definitions').select('id, slug, display_name, tradition, kind, active').eq('active', true).order('display_name'),
    db.from('observance_story_versions').select('id, definition_id, version, status, updated_at, published_at'),
    db.from('observance_content_sources').select('id, definition_id, approved'),
    db.from('observance_artwork').select('id, story_version_id, review_status'),
    db.from('observance_share_templates').select('id, story_version_id, language, audience, review_status'),
    db.from('observance_occurrences').select('definition_id, date').eq('publication_status', 'published').order('date'),
  ]);
  const migrationError = [versionsResult, sourcesResult, artworkResult, sharesResult].find((result) => result.error)?.error;
  if (definitionsResult.error || migrationError) return NextResponse.json({ error: 'Observance content migration is not available', detail: (definitionsResult.error ?? migrationError).message }, { status: 503 });
  const definitions = definitionsResult.data;
  const versions = versionsResult.data;
  const sources = sourcesResult.data;
  const artwork = artworkResult.data;
  const shares = sharesResult.data;
  const occurrences = occurrencesResult.data;

  const rows = (definitions ?? []).map((definition: any) => {
    const relatedVersions = (versions ?? []).filter((row: any) => row.definition_id === definition.id).sort((a: any, b: any) => b.version - a.version);
    const current = relatedVersions[0] ?? null;
    const dates = (occurrences ?? []).filter((row: any) => row.definition_id === definition.id).map((row: any) => row.date as string);
    const today = new Date().toISOString().slice(0, 10);
    return {
      ...definition,
      current,
      sourceCount: (sources ?? []).filter((row: any) => row.definition_id === definition.id && row.approved).length,
      approvedArtworkCount: current ? (artwork ?? []).filter((row: any) => row.story_version_id === current.id && row.review_status === 'approved').length : 0,
      approvedShareCount: current ? (shares ?? []).filter((row: any) => row.story_version_id === current.id && row.review_status === 'approved').length : 0,
      previousOccurrence: [...dates].reverse().find((date: string) => date < today) ?? null,
      nextOccurrence: dates.find((date: string) => date >= today) ?? null,
    };
  });
  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const db = createAdminClient() as any;

  if (body.action === 'add_source') {
    const { data, error } = await db.from('observance_content_sources').insert({
      definition_id: body.definitionId,
      title: body.title,
      author: body.author || null,
      source_url: body.url,
      citation: body.citation,
      source_tier: body.tier,
      rights_status: body.rightsStatus,
      excerpt: body.excerpt,
      language: body.language || 'en',
      approved: false,
    }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await audit(db, 'source_created', 'source', data.id, { definitionId: body.definitionId });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (body.action === 'approve_source') {
    const { error } = await db.from('observance_content_sources').update({ approved: true, reviewed_by: 'admin', reviewed_at: new Date().toISOString() }).eq('id', body.sourceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await audit(db, 'source_approved', 'source', body.sourceId, {});
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'generate_draft') {
    const [{ data: definition }, { data: sources }, { data: existing }] = await Promise.all([
      db.from('observance_definitions').select('id, slug, display_name, tradition').eq('id', body.definitionId).single(),
      db.from('observance_content_sources').select('*').eq('definition_id', body.definitionId).eq('approved', true),
      db.from('observance_story_versions').select('version').eq('definition_id', body.definitionId).order('version', { ascending: false }).limit(1),
    ]);
    if (!definition) return NextResponse.json({ error: 'Unknown observance' }, { status: 404 });
    if (!sources?.length) return NextResponse.json({ error: 'At least one approved source is required' }, { status: 409 });

    const sourcePacket = sources.map((source: any) => ({ id: source.id, title: source.title, citation: source.citation, excerpt: source.excerpt }));
    const result = await generateWithProvider({
      system: 'You are Shoonaya editorial drafting software. Use only supplied excerpts. Never invent quotations, rituals, history, or citations. Return JSON only.',
      user: `Draft a festival story for ${definition.display_name} (${definition.tradition}). Sources: ${JSON.stringify(sourcePacket)}. Return {"translations":{"en":{"teaser":"","origin":"","significance":"","rituals":[],"verse":null,"personalPractice":""},"hi":{...same keys...},"pa":{...same keys...}},"shareTemplates":[{"language":"en|hi|pa","audience":"sibling|family|teacher|community|friend|neutral","cta":"","title":"","message":""}]}. Include a neutral share template in every language plus any context-specific template justified by the observance. Every non-null verse must contain original, transliteration, translation, sourceId and sourceId must be one supplied id. Keep claims conservative and traceable.`,
    }, { responseFormat: 'json', maxOutputTokens: 5000 });
    const draft = parseJson(result.text);
    const languages = ['en', 'hi', 'pa'];
    if (!draft?.translations || !languages.every((language) => draft.translations[language])) return NextResponse.json({ error: 'Provider returned an incomplete language set' }, { status: 502 });
    const allowedSourceIds = new Set(sources.map((source: any) => source.id));
    for (const language of languages) {
      const verseSource = draft.translations[language]?.verse?.sourceId;
      if (verseSource && !allowedSourceIds.has(verseSource)) return NextResponse.json({ error: 'Provider cited an unapproved source' }, { status: 502 });
    }

    const version = Number(existing?.[0]?.version ?? 0) + 1;
    const { data: story, error: storyError } = await db.from('observance_story_versions').insert({
      definition_id: definition.id,
      version,
      status: 'draft',
      generation_provider: 'sarvam',
      generation_model: result.modelUsed,
      prompt_version: 'observance-story-v1',
      generation_metadata: { provider: result.provider, finishReason: result.finishReason },
    }).select('id').single();
    if (storyError) return NextResponse.json({ error: storyError.message }, { status: 400 });
    const writes = await Promise.all([
      db.from('observance_story_translations').insert(languages.map((language) => ({
        story_version_id: story.id,
        language,
        teaser: draft.translations[language].teaser,
        origin: draft.translations[language].origin,
        significance: draft.translations[language].significance,
        rituals: draft.translations[language].rituals,
        verse: draft.translations[language].verse,
        personal_practice: draft.translations[language].personalPractice,
        review_status: 'draft',
      }))),
      db.from('observance_story_source_links').insert(sources.map((source: any) => ({ story_version_id: story.id, source_id: source.id }))),
      draft.shareTemplates?.length ? db.from('observance_share_templates').insert(draft.shareTemplates.map((template: any) => ({ definition_id: definition.id, story_version_id: story.id, version, ...template, review_status: 'draft' }))) : Promise.resolve(),
    ]);
    const writeError = writes.find((write: any) => write?.error)?.error;
    if (writeError) {
      await db.from('observance_story_versions').delete().eq('id', story.id);
      return NextResponse.json({ error: 'Draft could not be stored completely', detail: writeError.message }, { status: 500 });
    }
    await audit(db, 'draft_generated', 'story_version', story.id, { definitionId: definition.id, version });
    return NextResponse.json({ ok: true, storyId: story.id, version });
  }

  if (body.action === 'publish') {
    const storyId = body.storyId;
    const [{ data: translations }, { data: links }, { data: artwork }, { data: shares }] = await Promise.all([
      db.from('observance_story_translations').select('language, review_status').eq('story_version_id', storyId),
      db.from('observance_story_source_links').select('source_id, observance_content_sources(approved)').eq('story_version_id', storyId),
      db.from('observance_artwork').select('kind, review_status').eq('story_version_id', storyId),
      db.from('observance_share_templates').select('language, audience, review_status').eq('story_version_id', storyId),
    ]);
    const missing = ['en', 'hi', 'pa'].filter((language) => !(translations ?? []).some((row: any) => row.language === language && row.review_status === 'approved'));
    const approvedSource = (links ?? []).some((row: any) => row.observance_content_sources?.approved);
    const approvedCardArt = (artwork ?? []).some((row: any) => row.kind === 'card' && row.review_status === 'approved');
    const approvedNeutralShare = (shares ?? []).some((row: any) => row.audience === 'neutral' && row.review_status === 'approved');
    if (missing.length || !approvedSource || !approvedCardArt || !approvedNeutralShare) {
      return NextResponse.json({ error: 'Publication gate failed', missingLanguages: missing, approvedSource, approvedCardArt, approvedNeutralShare }, { status: 409 });
    }
    const now = new Date().toISOString();
    await db.from('observance_story_versions').update({ status: 'archived' }).neq('id', storyId).eq('definition_id', body.definitionId).eq('status', 'published');
    const { error } = await db.from('observance_story_versions').update({ status: 'published', reviewed_by: 'admin', reviewed_at: now, published_at: now }).eq('id', storyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await audit(db, 'story_published', 'story_version', storyId, { definitionId: body.definitionId });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'approve_draft') {
    const now = new Date().toISOString();
    const [{ error: translationError }, { error: shareError }, { error: storyError }] = await Promise.all([
      db.from('observance_story_translations').update({ review_status: 'approved', reviewed_by: 'admin', reviewed_at: now }).eq('story_version_id', body.storyId),
      db.from('observance_share_templates').update({ review_status: 'approved', reviewed_by: 'admin', reviewed_at: now }).eq('story_version_id', body.storyId),
      db.from('observance_story_versions').update({ status: 'approved', reviewed_by: 'admin', reviewed_at: now, review_notes: body.reviewNotes || null }).eq('id', body.storyId),
    ]);
    const error = translationError || shareError || storyError;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await audit(db, 'draft_approved', 'story_version', body.storyId, { reviewNotes: body.reviewNotes || null });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'save_artwork') {
    const { data, error } = await db.from('observance_artwork').insert({
      definition_id: body.definitionId,
      story_version_id: body.storyId,
      kind: body.kind,
      version: body.version,
      uri: body.uri,
      width: body.width,
      height: body.height,
      focal_x: body.focalX ?? 0.5,
      focal_y: body.focalY ?? 0.5,
      alt_text: body.altText ?? {},
      generation_provider: body.generationProvider || null,
      prompt_version: body.promptVersion || null,
      review_status: 'needs_review',
    }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await audit(db, 'artwork_created', 'artwork', data.id, { definitionId: body.definitionId, storyId: body.storyId });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (body.action === 'approve_artwork') {
    const now = new Date().toISOString();
    const { error } = await db.from('observance_artwork').update({ review_status: 'approved', reviewed_by: 'admin', reviewed_at: now, cultural_review_notes: body.reviewNotes || null }).eq('id', body.artworkId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await audit(db, 'artwork_approved', 'artwork', body.artworkId, { reviewNotes: body.reviewNotes || null });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
