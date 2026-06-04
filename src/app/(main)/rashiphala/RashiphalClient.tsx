'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2 } from 'lucide-react';
import { getDailyHoroscope, RASHI_LIST } from '@/lib/jyotish/rashiphal-data';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';

interface Props {
  userRashi: string | null;
  timezone?: string;
}

export default function RashiphalClient({ userRashi, timezone = 'Asia/Kolkata' }: Props) {
  const { playHaptic } = useZenithSensory();
  const today = useMemo(() => new Date(), []);
  
  // Initialize with user's rashi if set, else default to 'aries'
  const [selectedRashi, setSelectedRashi] = useState<string>(() => {
    if (userRashi) {
      const match = RASHI_LIST.some(r => r.key === userRashi.toLowerCase());
      if (match) return userRashi.toLowerCase();
    }
    return 'aries';
  });

  const dateLabel = useMemo(() => {
    return today.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [today]);

  const h = useMemo(() => {
    return getDailyHoroscope(selectedRashi, today, timezone);
  }, [selectedRashi, today, timezone]);

  async function share() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shoonaya.com';
    const link = `${origin}/rashiphala`;
    const text = `Read & check your daily rashiphala following this link: ${link}\n\n` +
      `🐏 Daily Rashiphala for ${h.rashiSanskrit} (${h.rashi}) — ${dateLabel}\n\n` +
      `📿 Sadhana Focus: ${h.sadhanaFocus}\n` +
      `💼 Karma & Focus: ${h.karma}\n` +
      `🌿 Aura & Health: ${h.health}\n` +
      `✨ Lucky Color: ${h.luckyColor} | Lucky Number: ${h.luckyNumber}\n\n— Shoonaya`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Daily Rashiphala', text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      const toast = (await import('react-hot-toast')).default;
      toast.success('Copied to clipboard 📋');
    } catch { /* clipboard not available */ }
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--premium-ivory)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-6 pb-4 flex items-center gap-3 border-b"
        style={{ backgroundColor: 'var(--premium-ivory)', borderColor: 'var(--premium-border)' }}>
        <Link href="/panchang"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition border"
          style={{ background: 'white', borderColor: 'var(--premium-border)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--brand-primary-strong)' }} />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-lg font-semibold tracking-tight"
            style={{ color: 'var(--brand-primary-strong)' }}>
            Your Rashiphala
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--brand-muted)' }}>
            {dateLabel}
          </p>
        </div>
        <button onClick={share}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition border"
          style={{ background: 'white', borderColor: 'var(--premium-border)' }}
          aria-label="Share">
          <Share2 size={15} style={{ color: 'var(--brand-primary-strong)' }} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Horizontal Rashi/Zodiac sign selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
          {RASHI_LIST.map((rashi) => {
            const isSelected = selectedRashi === rashi.key;
            return (
              <button
                key={rashi.key}
                onClick={() => {
                  setSelectedRashi(rashi.key);
                  playHaptic('medium');
                }}
                className={`flex-shrink-0 snap-center flex flex-col items-center px-4 py-2.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-white shadow-sm'
                    : 'bg-white/40 hover:bg-white/70'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--premium-gold)' : 'var(--premium-border)',
                }}
              >
                <span className="text-xl">{rashi.symbol}</span>
                <span className="text-xs font-bold mt-1" style={{ color: 'var(--brand-primary-strong)' }}>{rashi.sa}</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: 'var(--brand-muted)' }}>{rashi.en}</span>
              </button>
            );
          })}
        </div>

        {/* Generated Horoscope details */}
        <motion.div
          key={selectedRashi}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Main Card */}
          <div className="rounded-2xl p-4 bg-white border flex flex-col gap-3 shadow-sm"
            style={{ borderColor: 'var(--premium-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border"
                style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
                {h.symbol}
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                  {h.rashiSanskrit} ({h.rashi})
                </h2>
                <p className="text-[11px] font-medium" style={{ color: 'var(--brand-muted)' }}>
                  Ruling Graha: <span className="font-semibold">{h.lord}</span>
                </p>
              </div>
            </div>
            
            <div className="rounded-xl border p-3"
              style={{ background: 'var(--premium-gold-soft)', borderColor: 'var(--premium-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                Transit Summary
              </p>
              <p className="text-sm font-medium leading-relaxed mt-1" style={{ color: 'var(--brand-primary-strong)' }}>
                {h.panditAiOracle}
              </p>
              <p className="text-[10px] leading-relaxed border-t pt-2 mt-2"
                style={{ color: 'var(--brand-muted)', borderColor: 'var(--premium-border)' }}>
                {h.accuracyNote}
              </p>
            </div>
          </div>

          {/* Transit Highlights */}
          <div className="rounded-2xl p-4 bg-white border space-y-3 shadow-sm"
            style={{ borderColor: 'var(--premium-border)' }}>
            <div className="flex items-start gap-2">
              <span className="text-lg">🪐</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                  Transit Facts
                </h3>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                  {h.gocharSummary}
                </p>
                <p className="text-[11px] font-medium mt-1 leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
                  {h.moonTransit}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {h.transitHighlights.slice(0, 4).map((item, idx) => {
                const isSupport = item.tone === 'support';
                const isDiscipline = item.tone === 'discipline';
                const highlightBg = isSupport 
                  ? 'rgba(16,185,129,0.06)' 
                  : isDiscipline 
                    ? 'rgba(249,115,22,0.06)' 
                    : 'rgba(62,42,31,0.03)';
                const highlightBorder = isSupport 
                  ? 'rgba(16,185,129,0.2)' 
                  : isDiscipline 
                    ? 'rgba(249,115,22,0.2)' 
                    : 'var(--premium-border)';
                const textCol = isSupport 
                  ? 'rgb(6,95,70)' 
                  : isDiscipline 
                    ? 'rgb(154,52,18)' 
                    : 'var(--brand-primary-strong)';
                return (
                  <div key={`${item.title}-${idx}`}
                    className="rounded-xl px-3 py-2 border"
                    style={{ background: highlightBg, borderColor: highlightBorder }}>
                    <p className="text-[10px] font-bold" style={{ color: textCol }}>
                      {item.title}
                    </p>
                    <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: 'var(--brand-muted)' }}>
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Life Guidance Areas */}
          <div className="grid gap-3">
            {[
              { icon: '💼', title: 'Work Guidance', text: h.karma },
              { icon: '🌿', title: 'Body & Energy', text: h.health },
              { icon: '💖', title: 'Relationships', text: h.love }
            ].map((item, index) => (
              <div key={index} className="rounded-2xl p-4 bg-white border flex gap-3 items-start shadow-sm"
                style={{ borderColor: 'var(--premium-border)' }}>
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sadhana / Practice Guidance */}
          <div className="rounded-2xl p-4 border space-y-3 relative overflow-hidden shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, var(--premium-gold-soft) 0%, rgba(255,255,255,0.95) 100%)',
              borderColor: 'var(--premium-gold)'
            }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none" 
              style={{ background: 'rgba(200,146,74,0.1)' }} />
            
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📿</span>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--premium-gold)' }}>
                  Practice Guidance
                </h3>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'var(--brand-muted)' }}>
                  Suggested Window
                </p>
                <p className="text-[11px] font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                  {h.luckyTime}
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
              {h.sadhanaFocus}
            </p>

            <div className="grid gap-2">
              {h.sadhanaPlan.map((step) => (
                <div key={step.label} className="rounded-xl border px-3 py-2 bg-white/70"
                  style={{ borderColor: 'var(--premium-border)' }}>
                  <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'var(--premium-gold)' }}>
                    {step.label}
                  </p>
                  <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'var(--brand-primary-strong)' }}>
                    {step.action}
                  </p>
                </div>
              ))}
            </div>

            {/* Dhyana Support */}
            <div className="rounded-xl border p-3 bg-white/80"
              style={{ borderColor: 'var(--premium-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>
                Dhyana Support
              </p>
              <p className="font-serif text-sm mt-1 leading-relaxed italic" style={{ color: 'var(--brand-primary-strong)' }}>
                {h.shloka}
              </p>
              <p className="text-[10px] font-medium mt-2 leading-relaxed" style={{ color: 'var(--premium-gold)' }}>
                {h.shlokaTranslation}
              </p>
              <p className="text-[10px] font-medium mt-2" style={{ color: 'var(--brand-primary-strong)' }}>
                Mantra Anchor: <span className="font-bold underline">{h.beejaMantra}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
