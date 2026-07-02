import type { BhaktiSound } from '@/lib/curated-bhakti';
import type { DevotionalTrack } from '@/lib/devotional-audio';
import type { Katha, KathaTradition } from '@/lib/katha-library';
import type { LibraryEntry, LibraryTradition } from '@/lib/library-content';
import type { Stotram } from '@/lib/stotrams';

export type SacredContentDomain = 'pathshala' | 'bhakti';
export type SacredContentKind =
  | 'scripture'
  | 'study-path'
  | 'katha'
  | 'stotram'
  | 'mantra'
  | 'chant'
  | 'audio'
  | 'practice';
export type SacredContentTradition = LibraryTradition | 'all';

export interface SacredContentItem {
  id: string;
  domain: SacredContentDomain;
  kind: SacredContentKind;
  title: string;
  subtitle?: string;
  description: string;
  href: string;
  tradition: SacredContentTradition;
  tags: string[];
  sourceLabel?: string;
  language?: string;
  durationLabel?: string;
  hasAudio?: boolean;
  licenseLabel?: string;
  progressKey?: string;
}

function normalizeTradition(tradition: LibraryTradition | KathaTradition | Stotram['tradition'] | DevotionalTrack['tradition']): SacredContentTradition {
  return tradition === 'all' ? 'all' : tradition;
}

export function libraryEntryToSacredContent(entry: LibraryEntry): SacredContentItem {
  return {
    id: entry.id,
    domain: 'pathshala',
    kind: 'scripture',
    title: entry.title,
    subtitle: entry.source,
    description: entry.meaning,
    href: `/pathshala?entry=${encodeURIComponent(entry.id)}`,
    tradition: entry.tradition,
    tags: entry.tags,
    sourceLabel: entry.source,
    progressKey: `pathshala:entry:${entry.id}`,
  };
}

export function kathaToSacredContent(katha: Katha): SacredContentItem {
  return {
    id: katha.id,
    domain: 'bhakti',
    kind: 'katha',
    title: katha.title,
    subtitle: katha.deity ?? katha.occasion,
    description: katha.preview,
    href: `/bhakti/katha/${katha.id}`,
    tradition: normalizeTradition(katha.tradition),
    tags: katha.tags,
    durationLabel: `${katha.durationMin} min`,
    progressKey: `bhakti:katha:${katha.id}`,
  };
}

export function stotramToSacredContent(stotram: Stotram): SacredContentItem {
  const kind: SacredContentKind =
    stotram.type === 'kirtan' || stotram.type === 'simran' || stotram.type === 'bhajan'
      ? 'chant'
      : stotram.type === 'dhyana'
        ? 'practice'
        : stotram.type;

  return {
    id: stotram.id,
    domain: 'bhakti',
    kind,
    title: stotram.title,
    subtitle: stotram.source,
    description: stotram.description,
    href: `/bhakti/stotram/${stotram.id}`,
    tradition: normalizeTradition(stotram.tradition),
    tags: [stotram.deity, stotram.type, stotram.language].filter(Boolean),
    sourceLabel: stotram.source,
    language: stotram.language,
    hasAudio: Boolean(stotram.audioTrackId),
    progressKey: `bhakti:stotram:${stotram.id}`,
  };
}

export function devotionalTrackToSacredContent(track: DevotionalTrack): SacredContentItem {
  return {
    id: track.id,
    domain: 'bhakti',
    kind: track.type === 'kirtan' ? 'chant' : track.type,
    title: track.title,
    subtitle: track.creator,
    description: track.note,
    href: track.sourceUrl,
    tradition: normalizeTradition(track.tradition),
    tags: [track.type, track.tradition, track.approvalStatus],
    sourceLabel: track.sourceName,
    durationLabel: track.durationLabel,
    hasAudio: track.inAppPlayback,
    licenseLabel: track.licenseLabel,
    progressKey: `bhakti:audio:${track.id}`,
  };
}

export function curatedSoundToSacredContent(sound: BhaktiSound): SacredContentItem {
  return {
    id: sound.id,
    domain: 'bhakti',
    kind: sound.type === 'bhajan' ? 'chant' : sound.type,
    title: sound.title,
    subtitle: sound.artist,
    description: [sound.deity, sound.mood].filter(Boolean).join(' · ') || 'Devotional audio',
    href: '/bhakti/browse',
    tradition: 'hindu',
    tags: [sound.type, sound.deity, sound.mood].filter(Boolean) as string[],
    durationLabel: sound.duration,
    hasAudio: true,
    progressKey: `bhakti:sound:${sound.id}`,
  };
}
