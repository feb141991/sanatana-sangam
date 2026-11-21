import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getLibraryEntryById } from '@/lib/library-content';
import { ScriptureCreativeWorkJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const revalidate = 86400;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = getLibraryEntryById(id);

  if (!entry) {
    return { title: 'Scripture Verse | Shoonaya' };
  }

  const description = (entry.meaning || `${entry.title} from ${entry.source}.`).slice(0, 160);
  const canonicalUrl = `https://www.shoonaya.com/pathshala/verse/${encodeURIComponent(id)}`;

  return {
    title: `${entry.title} — ${entry.source} | Shoonaya`,
    description,
    openGraph: {
      title: `${entry.title} — ${entry.source}`,
      description,
      type: 'article',
      url: canonicalUrl,
      images: [
        {
          url: 'https://www.shoonaya.com/icons/icon-512x512.png',
          width: 512,
          height: 512,
          alt: entry.title,
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ScriptureVersePage({ params }: Props) {
  const { id } = await params;
  const entry = getLibraryEntryById(id);

  if (!entry) {
    notFound();
  }

  const canonicalUrl = `https://www.shoonaya.com/pathshala/verse/${encodeURIComponent(id)}`;
  const traditionLabel = entry.tradition.charAt(0).toUpperCase() + entry.tradition.slice(1);

  return (
    <>
      <ScriptureCreativeWorkJsonLd
        title={entry.title}
        source={entry.source}
        original={entry.original}
        transliteration={entry.transliteration}
        meaning={entry.meaning}
        attribution={entry.attribution}
        tradition={entry.tradition}
        url={canonicalUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Pathshala', url: 'https://www.shoonaya.com/pathshala' },
          { name: `${traditionLabel} Dharma`, url: `https://www.shoonaya.com/traditions/${entry.tradition}` },
          { name: entry.title, url: canonicalUrl },
        ]}
      />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12" style={{ color: 'var(--text-cream)' }}>
        {/* Navigation Breadcrumb Pill */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--text-dim)' }}>
          <Link href="/pathshala" className="transition-colors hover:underline" style={{ color: 'var(--brand-primary)' }}>
            Pathshala
          </Link>
          <span>/</span>
          <Link href={`/traditions/${entry.tradition}`} className="transition-colors hover:underline">
            {traditionLabel}
          </Link>
          <span>/</span>
          <span className="truncate max-w-[200px] sm:max-w-none">{entry.source}</span>
        </nav>

        {/* Verse Card Header */}
        <article className="overflow-hidden rounded-2xl border p-6 sm:p-10 shadow-lg" style={{ background: 'var(--card-bg, #12100e)', borderColor: 'var(--card-border, #2a241e)' }}>
          <header className="border-b pb-6" style={{ borderColor: 'var(--card-border, #2a241e)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(217, 119, 6, 0.15)', color: 'var(--brand-primary, #f59e0b)' }}>
                {traditionLabel} Scripture
              </span>
              {entry.attribution && (
                <span className="text-xs" style={{ color: 'var(--text-dim, #a8a29e)' }}>
                  Attributed to {entry.attribution}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-serif text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {entry.title}
            </h1>
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-dim, #a8a29e)' }}>
              Source: <span className="font-semibold text-white/90">{entry.source}</span>
            </p>
          </header>

          {/* Original Sacred Text Block */}
          {entry.original && (
            <section className="mt-8 rounded-xl p-5 sm:p-7" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-primary, #f59e0b)' }}>
                Original Sacred Text
              </div>
              <blockquote className="whitespace-pre-line font-serif text-lg leading-relaxed tracking-wide sm:text-2xl" lang={entry.tradition === 'sikh' ? 'pa' : 'sa'}>
                {entry.original}
              </blockquote>
            </section>
          )}

          {/* Romanized Transliteration Block */}
          {entry.transliteration && (
            <section className="mt-6 rounded-xl p-5 sm:p-6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-dim, #a8a29e)' }}>
                IAST Romanized Transliteration
              </div>
              <p className="whitespace-pre-line font-mono text-sm leading-relaxed sm:text-base italic" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                {entry.transliteration}
              </p>
            </section>
          )}

          {/* English Translation & Meaning */}
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-primary, #f59e0b)' }}>
              Translation & Essential Meaning
            </h2>
            <div className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--text-cream, #f5f5f4)' }}>
              <p>{entry.meaning}</p>
            </div>
          </section>

          {/* Scripture Tags / Subject Classifications */}
          {entry.tags && entry.tags.length > 0 && (
            <footer className="mt-8 border-t pt-6" style={{ borderColor: 'var(--card-border, #2a241e)' }}>
              <div className="mb-3 text-xs font-medium" style={{ color: 'var(--text-dim, #a8a29e)' }}>
                Scriptural Topics & Themes:
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md px-2.5 py-1 text-xs font-mono"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-cream, #d6d3d1)' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </footer>
          )}
        </article>

        {/* Action CTAs for Guided Study */}
        <section className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border p-6 sm:flex-row" style={{ background: 'var(--card-bg, #12100e)', borderColor: 'var(--card-border, #2a241e)' }}>
          <div className="flex items-center gap-4">
            <Image src="/icons/icon-512x512.png" alt="Shoonaya" width={48} height={48} className="rounded-xl" />
            <div>
              <h3 className="font-serif text-lg font-semibold">Study with Shoonaya Pathshala</h3>
              <p className="text-sm" style={{ color: 'var(--text-dim, #a8a29e)' }}>
                Learn verses daily with guided lessons, recitation, and quizzes.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pathshala"
              className="inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--brand-primary, #f59e0b)', color: '#000000' }}
            >
              Explore Guided Courses
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
