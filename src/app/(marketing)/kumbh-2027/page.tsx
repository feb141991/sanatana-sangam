import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { getKumbhMelas, getAllKumbhDays, getNextKumbhDay, getNextAmritSnan } from '@/lib/kumbh';
import KumbhCountdownClient from './KumbhCountdownClient';
import { ShieldCheck, Sparkles, BookOpen, ExternalLink, Compass, Droplet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kumbh Mela 2027 Official Snan Dates & Live Countdown | Haridwar & Nashik Simhastha',
  description:
    'Comprehensive guide and live countdown to Kumbh Mela 2027 in Haridwar (Ganga) and Nashik Trimbakeshwar (Godavari). Verified Amrit Snan dates, astrological alignments, and pilgrim sankalp guidance.',
  alternates: {
    canonical: 'https://www.shoonaya.com/kumbh-2027',
  },
  openGraph: {
    title: 'Kumbh Mela 2027 Official Snan Schedule & Countdown | Shoonaya',
    description:
      'Verified bathing dates for Haridwar Kumbh 2027 and Nashik Simhastha 2027. Official Amrit Snan schedules and sacred astrological alignments.',
    type: 'website',
    url: 'https://www.shoonaya.com/kumbh-2027',
  },
};

export default function Kumbh2027Page() {
  const melas = getKumbhMelas();
  const allDays = getAllKumbhDays();
  const nextDay = getNextKumbhDay();
  const nextAmritSnan = getNextAmritSnan();

  // JSON-LD structured schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'When is Kumbh Mela 2027?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In 2027, two major Kumbh gatherings take place: Haridwar Kumbh Mela on the Ganga begins on 14 January 2027 (Makar Sankranti) and runs through April 2027. Nashik-Trimbakeshwar Simhastha Kumbh on the Godavari opens with flag hoisting on 31 October 2026, with major Amrit Snan bathing days in August and September 2027.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the main Amrit Snan (Shahi Snan) dates for Haridwar Kumbh 2027?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The confirmed Amrit Snan days for Haridwar Kumbh 2027 include Maha Shivratri (7 March 2027), Somvati Amavasya (5 April 2027), and Chaitra Purnima (20 April 2027) at Har Ki Pauri on the Ganga.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the major bathing days for Nashik Simhastha 2027?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The principal Amrit Snan days for Nashik Simhastha occur on 2 August 2027 (Ashadh Somvati Amavasya), 31 August 2027 (Mahakumbh Snan, Shravan Amavasya), and 11-12 September 2027 for the Vaishnava and Shaiva akharas at Ramtirth and Kushavarta.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-12 px-4 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shoonaya.com' },
          { name: 'Sacred Calendar', url: 'https://www.shoonaya.com/panchang' },
          { name: 'Kumbh Mela 2027 Guide', url: 'https://www.shoonaya.com/kumbh-2027' },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        {/* Page Hero */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Droplet className="w-3.5 h-3.5 text-amber-600" />
            <span>Canonical Pilgrim Reference</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Kumbh Mela 2027
          </h1>
          <p className="text-lg sm:text-xl font-serif text-amber-800 dark:text-amber-400 max-w-2xl">
            The Authoritative Snan Calendar, Sacred Astrological Alignments & Pilgrim Guide
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
            In 2027, the sacred convergence of Jupiter and the Sun aligns across two ancient pilgrimage capitals: Haridwar on the sacred Ganga, and Nashik–Trimbakeshwar on the Godavari.
          </p>
        </div>

        {/* Live Countdown & Interactive Schedule Component */}
        <KumbhCountdownClient
          melas={melas}
          allDays={allDays}
          nextDay={nextDay}
          nextAmritSnan={nextAmritSnan}
        />

        {/* ── Sacred Astrological Alignment Breakdown ───────────────────────── */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-600" />
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              The Cosmic Alignments of 2027
            </h3>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Hindu tradition traces the Kumbh to the <em>Samudra Manthan</em>, the churning of the cosmic ocean. When the vessel (Kalash) of celestial nectar (Amrit) emerged, drops fell upon four earthly locations: Haridwar, Prayagraj, Nashik, and Ujjain. The timing of each gathering is strictly governed by planetary transits:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">
                Haridwar Kumbh Alignment
              </span>
              <h4 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100 mb-2">
                Jupiter in Kumbha & Sun in Mesha
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Haridwar is where Mother Ganga descends from the Himalaya into the plains. The gathering occurs when Brihaspati (Jupiter) resides in Kumbha (Aquarius) and the Sun enters Mesha (Aries), energizing the holy waters at Har Ki Pauri with vital prana.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400 block mb-1">
                Nashik Simhastha Alignment
              </span>
              <h4 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100 mb-2">
                Jupiter in Simha (Leo)
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                When Jupiter transits Simha Rashi (Leo) while the Sun and Moon are in Cancer or Leo, the Simhastha Kumbh awakens in Nashik on the Godavari. Vaishnava sadhus bathe at Ramtirth while Shaiva sadhus bathe at Kushavarta Tirth in Trimbakeshwar.
              </p>
            </div>
          </div>
        </div>

        {/* ── Pilgrim Guidance & Sankalp Formula ────────────────────────────── */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Pilgrim Etiquette: The Sequence of Snan & Sankalp
            </h3>
          </div>

          <div className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100 block">The Mental Sankalp:</strong>
                Before stepping into the river, take water in your right palm and recite your gotra, ancestral lineage, the current tithi, the sacred geographic coordinates, and your dedicated spiritual intention.
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100 block">Three Sacred Immersions:</strong>
                Immerse completely three times while facing the rising Sun, offering thanks to Mother Ganga or Godavari and praying for universal peace (Lokah Samastah Sukhino Bhavantu).
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100 block">Daan (Charity) & Japa:</strong>
                After stepping out and changing into dry clothes, the classical sequence prescribes daan (offering food, clothing, or dakshina to scholars or the needy), followed by silent mantra japa.
              </div>
            </div>
          </div>
        </div>

        {/* ── Official Authority Sources & Link Magnet ──────────────────────── */}
        <div className="p-6 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <span className="font-semibold text-stone-800 dark:text-stone-200 block text-sm">
              Official Government & Mela Authority Sources
            </span>
            <p className="mt-0.5">
              Transcribed from the Uttarakhand Government Haridwar portal and Maharashtra Kumbh Mela Authority.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://haridwarkumbh.uk.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              Uttarakhand Portal <ExternalLink className="w-3 h-3" />
            </a>
            <span>·</span>
            <a
              href="https://simhasthamahakumbh.maharashtra.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              Maharashtra Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
