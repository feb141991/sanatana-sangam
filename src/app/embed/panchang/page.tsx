import type { Metadata } from 'next';
import Link from 'next/link';
import { calculatePanchang } from '@/lib/panchang';
import { resolveEmbedCity } from '@/lib/embed/cities';
import { Sunrise, Sunset, Clock, Sparkles, AlertCircle, Compass, Calendar } from 'lucide-react';

export const revalidate = 0;

interface EmbedPanchangPageProps {
  searchParams: Promise<{
    city?: string;
    lat?: string;
    lon?: string;
    tz?: string;
    theme?: 'light' | 'dark' | 'gold';
    compact?: string;
    lang?: string;
  }>;
}

export async function generateMetadata({ searchParams }: EmbedPanchangPageProps): Promise<Metadata> {
  const params = await searchParams;
  const location = resolveEmbedCity(params);
  return {
    title: `Today's Panchang for ${location.name} | Shoonaya Widget`,
    description: `Astronomically verified daily Vedic Panchang for ${location.name}, ${location.country}. Powered by Shoonaya Sacred Calendar.`,
  };
}

export default async function EmbedPanchangPage({ searchParams }: EmbedPanchangPageProps) {
  const params = await searchParams;
  const location = resolveEmbedCity(params);
  const theme = params.theme || 'light';
  const isCompact = params.compact === 'true' || params.compact === '1';

  // Compute panchang for current instant in the target city's timezone
  const now = new Date();
  const panchang = calculatePanchang(now, location.lat, location.lon, location.tz);

  // Theme styling configurations
  const themeStyles = {
    light: {
      card: 'bg-white text-stone-900 border-stone-200 shadow-sm',
      headerBg: 'bg-amber-50/70 border-amber-100',
      accentText: 'text-amber-800',
      pillBg: 'bg-amber-100/70 text-amber-900',
      metricBg: 'bg-stone-50 border-stone-200/60',
      mutedText: 'text-stone-500',
      footerBorder: 'border-stone-100 bg-stone-50/80 text-stone-600',
      linkText: 'text-amber-700 hover:text-amber-900',
    },
    dark: {
      card: 'bg-stone-900 text-stone-100 border-stone-800 shadow-md',
      headerBg: 'bg-stone-800/60 border-stone-700/50',
      accentText: 'text-amber-400',
      pillBg: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
      metricBg: 'bg-stone-800/50 border-stone-700/40',
      mutedText: 'text-stone-400',
      footerBorder: 'border-stone-800 bg-stone-950/60 text-stone-400',
      linkText: 'text-amber-400 hover:text-amber-300',
    },
    gold: {
      card: 'bg-amber-950 text-amber-50 border-amber-700/40 shadow-lg',
      headerBg: 'bg-amber-900/40 border-amber-700/30',
      accentText: 'text-amber-300',
      pillBg: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
      metricBg: 'bg-amber-900/30 border-amber-700/30',
      mutedText: 'text-amber-200/70',
      footerBorder: 'border-amber-900/60 bg-amber-950/80 text-amber-300/80',
      linkText: 'text-amber-300 hover:text-amber-100',
    },
  }[theme];

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 sm:p-3 box-border">
      <div
        className={`w-full rounded-2xl border overflow-hidden transition-all flex flex-col ${themeStyles.card}`}
      >
        {/* Header: Location & Civil Date */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${themeStyles.headerBg}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate leading-tight tracking-wide">
                {location.name}
              </h2>
              <p className={`text-[11px] truncate leading-tight ${themeStyles.mutedText}`}>
                {location.country} · {panchang.date}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${themeStyles.pillBg}`}>
            VS {panchang.samvatYear}
          </span>
        </div>

        {/* Primary Tithi Display */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-xs uppercase tracking-wider font-medium ${themeStyles.mutedText}`}>
                Tithi & Paksha
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-xl font-bold font-serif tracking-tight">
                  {panchang.tithi}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${themeStyles.pillBg}`}>
                  {panchang.paksha} Paksha
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${themeStyles.mutedText}`}>
                Valid upto {panchang.tithiUpto}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs uppercase tracking-wider font-medium ${themeStyles.mutedText}`}>
                Masa & Vara
              </span>
              <p className="text-sm font-semibold mt-0.5">
                {panchang.masaName}
              </p>
              <p className={`text-xs ${themeStyles.mutedText}`}>
                {panchang.vara}
              </p>
            </div>
          </div>

          {/* Astronomical Grid */}
          {!isCompact && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${themeStyles.metricBg}`}>
                <Sunrise className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className={`text-[10px] uppercase font-medium block truncate ${themeStyles.mutedText}`}>
                    Sunrise
                  </span>
                  <span className="text-xs font-bold leading-none block mt-0.5 truncate">
                    {panchang.sunrise}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${themeStyles.metricBg}`}>
                <Sunset className="w-4 h-4 text-orange-500 shrink-0" />
                <div className="min-w-0">
                  <span className={`text-[10px] uppercase font-medium block truncate ${themeStyles.mutedText}`}>
                    Sunset
                  </span>
                  <span className="text-xs font-bold leading-none block mt-0.5 truncate">
                    {panchang.sunset}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${themeStyles.metricBg}`}>
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className={`text-[10px] uppercase font-medium block truncate ${themeStyles.mutedText}`}>
                    Nakshatra
                  </span>
                  <span className="text-xs font-bold leading-none block mt-0.5 truncate">
                    {panchang.nakshatra}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${themeStyles.metricBg}`}>
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <span className={`text-[10px] uppercase font-medium block truncate ${themeStyles.mutedText}`}>
                    Abhijit Muhurta
                  </span>
                  <span className="text-xs font-bold leading-none block mt-0.5 truncate">
                    {panchang.abhijitMuhurat || 'None today'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rahu Kaal Warning Banner */}
          <div className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${themeStyles.metricBg}`}>
            <span className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              Rahu Kaal:
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {panchang.rahuKaal}
            </span>
          </div>
        </div>

        {/* Attribution & Canonical Backlink (Dofollow SEO Magnet) */}
        <div className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] ${themeStyles.footerBorder}`}>
          <span className="truncate">
            Calculated for local solar dawn
          </span>
          <Link
            href="https://www.shoonaya.com/panchang"
            target="_blank"
            rel="noopener"
            className={`font-semibold inline-flex items-center gap-1 transition-colors underline-offset-2 hover:underline ${themeStyles.linkText}`}
          >
            <span>🕉️ Shoonaya Panchang</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

