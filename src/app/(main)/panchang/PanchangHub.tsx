'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PanchangData {
  tithi:           string;
  nakshatra:       string;
  yoga:            string;
  sunrise:         string;
  sunset:          string;
  rahuKaal:        string;
  brahmaMuhurta?:  string;
  abhijitMuhurat?: string;
  tithiIndex:      number;
  paksha:          string;
}

interface Props {
  panchang: PanchangData;
  userRashi: string | null;
  tradition: string;
}

const RASHI_MAP: Record<string, { symbol: string; sa: string; en: string }> = {
  aries:       { symbol: '🐏', sa: 'मेष', en: 'Aries' },
  taurus:      { symbol: '🐂', sa: 'वृषभ', en: 'Taurus' },
  gemini:      { symbol: '👥', sa: 'मिथुन', en: 'Gemini' },
  cancer:      { symbol: '🦀', sa: 'कर्क', en: 'Cancer' },
  leo:         { symbol: '🦁', sa: 'सिंह', en: 'Leo' },
  virgo:       { symbol: '♍', sa: 'कन्या', en: 'Virgo' },
  libra:       { symbol: '⚖️', sa: 'तुला', en: 'Libra' },
  scorpio:     { symbol: '🦂', sa: 'वृश्चिक', en: 'Scorpio' },
  sagittarius: { symbol: '🏹', sa: 'धनु', en: 'Sagittarius' },
  capricorn:   { symbol: '🐊', sa: 'मकर', en: 'Capricorn' },
  aquarius:    { symbol: '🏺', sa: 'कुंभ', en: 'Aquarius' },
  pisces:      { symbol: '🐟', sa: 'मीन', en: 'Pisces' },
};

const TRADITION_EMOJIS: Record<string, string> = {
  hindu:    '🕉️',
  sikh:     '☬',
  buddhist: '☸️',
  jain:     '🤲',
};

export default function PanchangHub({ panchang, userRashi, tradition }: Props) {
  const { t } = useLanguage();
  const today = useMemo(() => new Date(), []);
  
  const dateStr = useMemo(() => {
    return today.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, [today]);

  const traditionEmoji = TRADITION_EMOJIS[tradition] ?? '🕉️';

  const rashiObj = useMemo(() => {
    if (userRashi) {
      return RASHI_MAP[userRashi.toLowerCase()] ?? null;
    }
    return null;
  }, [userRashi]);

  const moonPhase = useMemo(() => {
    const idx = panchang.tithiIndex;
    const pk = panchang.paksha;
    if (typeof idx !== 'number') return { emoji: '🌙', text: 'Waxing Gibbous' };
    
    if (idx === 15) return { emoji: '🌕', text: 'Full Moon' };
    if (idx === 30 || idx === 0) return { emoji: '🌑', text: 'New Moon' };
    
    if (pk === 'Shukla') {
      if (idx < 8) return { emoji: '🌒', text: 'Waxing Crescent' };
      if (idx === 8) return { emoji: '🌓', text: 'First Quarter' };
      return { emoji: '🌔', text: 'Waxing Gibbous' };
    } else {
      const relIdx = idx > 15 ? idx - 15 : idx;
      if (relIdx < 8) return { emoji: '🌖', text: 'Waning Gibbous' };
      if (relIdx === 8) return { emoji: '🌗', text: 'Third Quarter' };
      return { emoji: '🌘', text: 'Waning Crescent' };
    }
  }, [panchang.tithiIndex, panchang.paksha]);

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--premium-ivory)' }}>
      {/* Sticky Daily Strip */}
      <div className="sticky top-0 z-40 px-4 py-3 flex flex-col border-b shadow-sm"
        style={{ backgroundColor: 'var(--premium-ivory)', borderColor: 'rgba(200,160,110,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/home"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition border bg-white"
              style={{ borderColor: 'var(--premium-border)' }}>
              <ArrowLeft size={15} style={{ color: 'var(--brand-primary-strong)' }} />
            </Link>
            <span className="text-lg leading-none">{traditionEmoji}</span>
            <span className="font-serif font-bold text-base tracking-tight"
              style={{ color: 'var(--brand-primary-strong)' }}>
              {panchang.tithi}
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--brand-muted)' }}>
            {dateStr}
          </span>
        </div>
        <div className="mt-1 pl-10 text-[10px] tracking-wide" style={{ color: 'var(--brand-muted)' }}>
          {panchang.nakshatra} · Sunrise {panchang.sunrise}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
        {/* Hub Card Entry List */}
        
        {/* Card A: Panchang */}
        <Link href="/panchang/today" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/80 border transition-all hover:bg-white shadow-sm"
          style={{ borderColor: 'var(--premium-border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'var(--premium-gold-soft)', color: 'var(--premium-gold)' }}>
            📅
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-[18px] font-bold leading-tight" style={{ color: 'var(--brand-primary-strong)' }}>
              Today&apos;s Panchang
            </h2>
            <p className="text-xs truncate mt-1" style={{ color: 'var(--brand-muted)' }}>
              {panchang.tithi} · {panchang.nakshatra} · {panchang.yoga}
            </p>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--premium-gold)' }}>
              Muhurtas & Rahu Kaal
            </span>
          </div>
          <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Card B: Rashiphala */}
        <Link href="/rashiphala" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/80 border transition-all hover:bg-white shadow-sm"
          style={{ borderColor: 'var(--premium-border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'var(--premium-gold-soft)', color: 'var(--premium-gold)' }}>
            {rashiObj ? rashiObj.symbol : '✨'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-[18px] font-bold leading-tight" style={{ color: 'var(--brand-primary-strong)' }}>
              Your Rashiphala
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-muted)' }}>
              {rashiObj ? (
                <>
                  <span className="font-semibold text-gray-800">{rashiObj.sa}</span> · Today&apos;s reading
                </>
              ) : (
                <span className="italic">Set your Rashi to personalise</span>
              )}
            </p>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--premium-gold)' }}>
              Daily · Weekly · Monthly
            </span>
          </div>
          <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Card C: Kundali */}
        <Link href="/kundali" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/80 border transition-all hover:bg-white shadow-sm"
          style={{ borderColor: 'var(--premium-border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'var(--premium-gold-soft)', color: 'var(--premium-gold)' }}>
            🛕
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-[18px] font-bold leading-tight" style={{ color: 'var(--brand-primary-strong)' }}>
              Vedic Kundali
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-muted)' }}>
              Generate your birth chart
            </p>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--premium-gold)' }}>
              Lagna · Dasha · Transits
            </span>
          </div>
          <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Quick Facts Strip */}
        <div className="pt-2">
          <p className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--brand-muted)' }}>
            Quick Astrological Facts
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Sunrise */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
              style={{ background: 'rgba(200,146,74,0.07)', borderColor: 'rgba(200,146,74,0.2)', color: 'var(--brand-primary-strong)' }}>
              <span>🌅 Sunrise {panchang.sunrise}</span>
            </div>
            
            {/* Rahu Kaal */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)', color: 'rgb(153,27,27)' }}>
              <span>⚠️ Rahu {panchang.rahuKaal}</span>
            </div>

            {/* Abhijit */}
            {panchang.abhijitMuhurat && (
              <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
                style={{ background: 'rgba(200,146,74,0.07)', borderColor: 'rgba(200,146,74,0.2)', color: 'var(--brand-primary-strong)' }}>
                <span>✨ Abhijit {panchang.abhijitMuhurat}</span>
              </div>
            )}

            {/* Moon Phase */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
              style={{ background: 'rgba(200,146,74,0.07)', borderColor: 'rgba(200,146,74,0.2)', color: 'var(--brand-primary-strong)' }}>
              <span>{moonPhase.emoji} {moonPhase.text}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
