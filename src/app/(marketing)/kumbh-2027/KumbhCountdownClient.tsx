'use client';

import { useState, useEffect } from 'react';
import type { KumbhDay, KumbhMela } from '@/lib/kumbh';
import { Calendar, Clock, MapPin, Sparkles, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  melas: KumbhMela[];
  allDays: KumbhDay[];
  nextDay: KumbhDay | null;
  nextAmritSnan: KumbhDay | null;
}

export default function KumbhCountdownClient({ melas, allDays, nextDay, nextAmritSnan }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'haridwar' | 'nashik'>('all');
  const targetDate = nextAmritSnan ? new Date(`${nextAmritSnan.date}T00:00:00+05:30`) : new Date('2027-01-14T00:00:00+05:30');

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function calculateTime() {
      const difference = +targetDate - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const filteredDays = allDays.filter((day) => {
    if (activeTab === 'haridwar') return day.melaSlug === 'haridwar-kumbh-2027';
    if (activeTab === 'nashik') return day.melaSlug === 'nashik-trimbakeshwar-simhastha-2027';
    return true;
  });

  return (
    <div className="flex flex-col gap-10">
      {/* ── Live Hero Countdown ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 text-amber-50 border border-amber-800/40 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Next Major Amrit Snan: {nextAmritSnan?.title || 'Haridwar Opening Snan'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-amber-100 tracking-tight">
            Counting Down to Sacred Waters
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80 max-w-xl">
            {nextAmritSnan?.place} · {nextAmritSnan?.date}
          </p>

          {/* Countdown Clock Units */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-2 w-full max-w-md">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((unit) => (
              <div
                key={unit.label}
                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-black/40 border border-amber-500/20 shadow-inner"
              >
                <span className="text-2xl sm:text-4xl font-bold font-mono text-amber-300">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-amber-200/60 mt-1">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dual Gathering Filters ─────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Verified Bathing Schedule (2026–2028)
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
              Source-backed dates transcribed from state Mela authorities. No unverified dates.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            {[
              { id: 'all', label: 'All Snan Days' },
              { id: 'haridwar', label: 'Haridwar (Ganga)' },
              { id: 'nashik', label: 'Nashik (Godavari)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bathing Days Table / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDays.map((day, idx) => {
            const isAmritSnan = day.kind === 'amrit_snan' || day.kind === 'principal_amrit_snan';
            const isPrincipal = day.kind === 'principal_amrit_snan';

            return (
              <div
                key={`${day.melaSlug}-${day.date}-${idx}`}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isPrincipal
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border-amber-300 dark:border-amber-700/60 shadow-md ring-1 ring-amber-500/20'
                    : isAmritSnan
                    ? 'bg-white dark:bg-stone-900 border-amber-200 dark:border-amber-800/40 shadow-sm'
                    : 'bg-white/80 dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tracking-wide font-mono">
                      {day.date}
                    </span>
                    {isPrincipal ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
                        Mahakumbh Amrit Snan
                      </span>
                    ) : isAmritSnan ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
                        Amrit Snan (Shahi Snan)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        Parva Snan
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {day.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{day.place}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="truncate">{day.melaName}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Confirmed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
