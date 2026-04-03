import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLibrarySourceMeta } from '@/lib/library-provenance';
import {
  getLibraryEntryById,
  getLibrarySectionById,
  getPathshalaTraditionMeta,
  getRelatedEntries,
  getSectionForEntry,
  isLibraryTradition,
} from '@/lib/library-content';
import { getPathshalaEntryHrefFromSection, getPathshalaSectionHref, getPathshalaTraditionHref } from '@/lib/pathshala-links';

export default async function PathshalaEntryPage({
  params,
}: {
  params: Promise<{ tradition: string; section: string; entryId: string }>;
}) {
  const { tradition, section, entryId } = await params;

  if (!isLibraryTradition(tradition)) {
    notFound();
  }

  const traditionMeta = getPathshalaTraditionMeta(tradition);
  const sectionMeta = getLibrarySectionById(section);
  const entry = getLibraryEntryById(entryId);
  const entrySection = entry ? getSectionForEntry(entry) : undefined;

  if (!sectionMeta || !entry || !entrySection || sectionMeta.id !== entrySection.id || sectionMeta.tradition !== tradition) {
    notFound();
  }

  const sourceMeta = getLibrarySourceMeta(entry);
  const relatedEntries = getRelatedEntries(entry, 4);

  return (
    <div className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Link href="/library" className="text-[color:var(--brand-primary)]">Pathshala</Link>
          <span>•</span>
          <Link href={getPathshalaTraditionHref(tradition)} className="text-[color:var(--brand-primary)]">{traditionMeta.label}</Link>
          <span>•</span>
          <Link href={getPathshalaSectionHref(tradition, sectionMeta.id)} className="text-[color:var(--brand-primary)]">{sectionMeta.title}</Link>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
              {sectionMeta.emoji} {sectionMeta.title}
            </span>
            <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
              {sourceMeta.label}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{entry.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{entry.source}</p>
          </div>
        </div>
      </div>

      <article className="clay-card rounded-[1.8rem] px-5 py-5 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Original text</p>
          <p
            className={`mt-3 whitespace-pre-line leading-relaxed ${
              entry.tradition === 'sikh'
                ? 'text-base'
                : entry.tradition === 'buddhist' || entry.tradition === 'jain'
                  ? 'font-mono text-sm'
                  : 'font-devanagari text-lg'
            } text-gray-900`}
            style={{ fontFamily: entry.tradition === 'hindu' ? 'var(--font-devanagari, serif)' : 'inherit' }}
          >
            {entry.original}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Transliteration</p>
          <p className="mt-2 text-sm text-gray-600 italic leading-relaxed whitespace-pre-line">{entry.transliteration}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Meaning</p>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{entry.meaning}</p>
        </div>

        <div className="glass-panel rounded-[1.35rem] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Source note</p>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">{sourceMeta.note}</p>
        </div>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span key={tag} className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {relatedEntries.length > 0 && (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Study next</p>
            <p className="text-sm text-gray-600 mt-1">Continue inside the same text family without returning to the top-level Pathshala browse.</p>
          </div>
          <div className="grid gap-3">
            {relatedEntries.map((relatedEntry) => (
              <Link
                key={relatedEntry.id}
                href={getPathshalaEntryHrefFromSection(sectionMeta, relatedEntry)}
                className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{relatedEntry.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1 line-clamp-2">{relatedEntry.meaning}</p>
                  </div>
                  <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
