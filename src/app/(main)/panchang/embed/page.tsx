import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { ArrowLeft, Code, Sparkles, ShieldCheck } from 'lucide-react';
import EmbedGeneratorClient from './EmbedGeneratorClient';

export const metadata: Metadata = {
  title: 'Free Embeddable Vedic Panchang Widget for Temples & Community Sites | Shoonaya',
  description:
    'Embed an ad-free, city-accurate daily Hindu Panchang widget on your temple, mandir, or community website. Free 1-line copy-paste iframe updated automatically every dawn with verified Udaya Tithi and Muhurta.',
  alternates: {
    canonical: 'https://www.shoonaya.com/panchang/embed',
  },
  openGraph: {
    title: 'Free Embeddable Vedic Panchang Widget | Shoonaya',
    description:
      'Embed an ad-free, city-accurate daily Hindu Panchang on your website. Provides verified Tithi, Nakshatra, Sunrise, and Rahu Kaal for 40+ global diaspora cities.',
    type: 'website',
    url: 'https://www.shoonaya.com/panchang/embed',
  },
};

export default function PanchangEmbedPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-4 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Panchang Hub', url: 'https://www.shoonaya.com/panchang' },
          { name: 'Embed Widget Generator', url: 'https://www.shoonaya.com/panchang/embed' },
        ]}
      />

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Top Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/panchang"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Daily Panchang Hub
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Webmaster & Temple Resource
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Embed Daily Panchang Widget
              </h1>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                Add an ad-free, astronomically verified Vedic Panchang to your temple or community website with a single line of HTML code.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs text-stone-500 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ad-Free · Pure Astrometry · 100% Free</span>
            </div>
          </div>
        </div>

        {/* Interactive Embed Builder */}
        <EmbedGeneratorClient />
      </div>
    </div>
  );
}

