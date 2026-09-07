import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SEED_PATHS } from '@/lib/pathshala-paths';
import { GeoArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { extractPathshalaGeo } from '@/lib/seo/geo-extractors';
import Link from 'next/link';
import Image from 'next/image';
import { getPathLessons } from '@/lib/pathshala-lessons';
interface Props {
  params: Promise<{ pathId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pathId } = await params;
  const path = SEED_PATHS.find(p => p.id === pathId);
  
  if (!path) return { title: 'Pathshala | Shoonaya' };

  const description = `${path.description} Follow a ${path.total_lessons}-lesson guided scripture course for ${path.difficulty} learners.`.slice(0, 160);
  
  return {
    title: `${path.title}: Guided Scripture Course | Shoonaya`,
    description,
    openGraph: {
      title: `${path.title}: Guided Scripture Course`,
      description,
      type: 'article',
      url: `https://www.shoonaya.com/pathshala/${pathId}`,
    },
    alternates: {
      canonical: `https://www.shoonaya.com/pathshala/${pathId}`
    }
  };
}

export default async function PathshalaPathPage({ params }: Props) {
  const { pathId } = await params;
  const path = SEED_PATHS.find(p => p.id === pathId);
  
  if (!path) notFound();

  const geo = extractPathshalaGeo(path);
  const canonicalUrl = `https://www.shoonaya.com/pathshala/${pathId}`;
  const lessons = getPathLessons(pathId).filter(lesson => lesson.entries.length > 0);

  return (
    <>
      <GeoArticleJsonLd geo={geo} url={canonicalUrl} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://www.shoonaya.com' },
        { name: 'Pathshala', url: 'https://www.shoonaya.com/pathshala' },
        { name: path.title, url: canonicalUrl }
      ]} />
      <article className="py-8 sm:py-12" style={{ color: 'var(--text-cream)' }}>
        <Link href="/pathshala" className="inline-flex min-h-11 items-center underline underline-offset-4" style={{ color: 'var(--brand-primary)' }}>Pathshala</Link>
        <header className="mt-5 border-b pb-8" style={{ borderColor: 'var(--card-border)' }}>
          <Image src="/icons/icon-512x512.png" alt="Shoonaya" width={56} height={56} />
          <p className="mt-4 text-sm capitalize" style={{ color: 'var(--text-dim)' }}>{path.tradition} · {path.difficulty}</p>
          <h1 className="mt-3 break-words font-serif text-3xl leading-tight sm:text-4xl">{path.title}</h1>
          <p className="mt-5 text-lg leading-relaxed" style={{ color: 'var(--text-dim)' }}>{path.description}</p>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-dim)' }}>{path.duration_days}-day suggested pace · {path.proRequired ? 'Shoonaya Pro' : 'Free course'}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href={`/pathshala/${pathId}/lesson`} className="inline-flex min-h-11 items-center rounded-lg px-5 font-semibold" style={{ background: 'var(--brand-primary)', color: 'var(--divine-bg)' }}>Open lessons</Link>
            <Link href="/pathshala" className="inline-flex min-h-11 items-center underline underline-offset-4">Browse courses</Link>
          </div>
        </header>
        <section className="py-8" aria-labelledby="curriculum-title">
          <h2 id="curriculum-title" className="font-serif text-2xl">Course outline</h2>
          {lessons.length > 0 ? <ol className="mt-5 divide-y" style={{ borderColor: 'var(--card-border)' }}>
            {lessons.map((lesson, index) => <li key={`${index}-${lesson.title}`} className="flex gap-4 py-4">
              <span className="w-7 shrink-0 tabular-nums" style={{ color: 'var(--brand-primary)' }}>{index + 1}.</span>
              <span className="min-w-0 break-words">{lesson.title}</span>
            </li>)}
          </ol> : <p className="mt-4" style={{ color: 'var(--text-dim)' }}>Lesson content is not available yet.</p>}
        </section>
      </article>
    </>
  );
}
