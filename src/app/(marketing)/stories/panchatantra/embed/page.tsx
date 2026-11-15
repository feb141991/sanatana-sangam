import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { listPublicPanchatantraStories } from '@/lib/panchatantra-public';
import PanchatantraEmbedClient from './PanchatantraEmbedClient';
import { ArrowLeft, BookOpen, Sparkles, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free Embeddable Panchatantra Story of the Day Widget | Shoonaya',
  description:
    'Embed a free, ad-free Panchatantra Story of the Day widget on your school, homeschooling blog, or cultural website. Includes 3D claymation artwork and bilingual moral takeaways.',
  alternates: {
    canonical: 'https://www.shoonaya.com/stories/panchatantra/embed',
  },
  openGraph: {
    title: 'Embed Panchatantra Fables Widget | Shoonaya',
    description:
      'Add a daily rotating illustrated Panchatantra moral story to your website in 1 line of HTML. Free and ad-free for educators.',
    type: 'website',
    url: 'https://www.shoonaya.com/stories/panchatantra/embed',
  },
};

export default function PanchatantraEmbedPage() {
  const stories = listPublicPanchatantraStories();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-4 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Panchatantra Stories', url: 'https://www.shoonaya.com/stories/panchatantra' },
          { name: 'Embed Story Widget', url: 'https://www.shoonaya.com/stories/panchatantra/embed' },
        ]}
      />

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Top Navigation */}
        <div className="flex flex-col gap-3">
          <Link
            href="/stories/panchatantra"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Panchatantra Library
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Educator & Webmaster Resource</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Embed Panchatantra Story Widget
              </h1>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                Add an ad-free, claymation-illustrated daily moral fable to your classroom portal or parenting blog in 30 seconds.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs text-stone-500 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ad-Free · Bilingual · 100% Free</span>
            </div>
          </div>
        </div>

        {/* Interactive Embed Builder */}
        <PanchatantraEmbedClient stories={stories} />
      </div>
    </div>
  );
}
