'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Share2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import {
  resolveFestivalText,
  resolveFestivalList,
  isFestivalPublishable,
  type FestivalContent,
} from '@/lib/festival-data';
import type { ClientObservanceResult } from '@/lib/calendar/observance-formatter';
import { ObservanceStatusNotice } from '@/components/ui/ObservanceStatusNotice';

interface FestivalClientProps {
  festival: FestivalContent;
  originalSlug: string;
}

export default function FestivalClient({ festival, originalSlug }: FestivalClientProps) {
  const [calendarObservance, setCalendarObservance] = useState<ClientObservanceResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    fetch(`/api/calendar/upcoming?days=60&tz=${encodeURIComponent(timezone)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (controller.signal.aborted) return;
        const observances = Array.isArray(data?.observances)
          ? (data.observances as ClientObservanceResult[])
          : [];
        const matching = observances.filter(
          (observance) =>
            observance.route_slug === originalSlug || observance.slug === originalSlug,
        );
        setCalendarObservance(matching.find((observance) => observance.isPrimary) ?? matching[0] ?? null);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError' && !controller.signal.aborted) {
          setCalendarObservance(null);
        }
      });

    return () => controller.abort();
  }, [originalSlug]);

  const name = resolveFestivalText(festival.name) || festival.definitionKey;
  const tagline = resolveFestivalText(festival.tagline);
  const significance = resolveFestivalText(festival.significance);
  const rituals = resolveFestivalList(festival.rituals);
  const dos = resolveFestivalList(festival.dos);
  const donts = resolveFestivalList(festival.donts);
  const pujaItems = resolveFestivalList(festival.pujaItems);
  const mantraTranslation = festival.mantra ? resolveFestivalText(festival.mantra.translation) : '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/home" className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <button
          type="button"
          onClick={() => navigator.share?.({ title: name, url: window.location.href })}
          className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {!isFestivalPublishable(festival) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>This festival&apos;s content is still pending editorial/source review and is not yet shown to regular readers.</span>
        </div>
      )}

      <section className="space-y-3 text-center">
        <div className="text-5xl">{festival.emoji}</div>
        <h1 className="text-2xl font-bold">{name}</h1>
        {tagline && <p className="italic opacity-80">&ldquo;{tagline}&rdquo;</p>}

        {calendarObservance && (
          <ObservanceStatusNotice
            status={calendarObservance.status}
            reviewStatus={calendarObservance.reviewStatus}
            primaryDate={calendarObservance.civilDate}
            alternatives={calendarObservance.alternatives}
            sourceRefs={calendarObservance.sourceRefs}
            className="pt-2"
          />
        )}
      </section>

      {significance && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Significance</h2>
          <p className="opacity-90 leading-relaxed">{significance}</p>
        </section>
      )}

      {rituals.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Rituals</h2>
          <ul className="list-disc pl-5 space-y-1 opacity-90">
            {rituals.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>
      )}

      {(dos.length > 0 || donts.length > 0) && (
        <section className="grid sm:grid-cols-2 gap-4">
          {dos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">Do&apos;s</h3>
              <ul className="list-disc pl-5 space-y-1 opacity-90">
                {dos.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
          {donts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-700">Don&apos;ts</h3>
              <ul className="list-disc pl-5 space-y-1 opacity-90">
                {donts.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {pujaItems.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Puja Items</h2>
          <p className="opacity-90">{pujaItems.join(', ')}</p>
        </section>
      )}

      {festival.mantra && mantraTranslation && (
        <section className="space-y-2 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Sacred Mantra</h2>
          <p className="text-lg leading-relaxed">{festival.mantra.sanskrit}</p>
          <p className="italic opacity-70">{festival.mantra.transliteration}</p>
          <p className="opacity-90">{mantraTranslation}</p>
        </section>
      )}
    </div>
  );
}
