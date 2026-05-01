'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, RotateCcw, Repeat, BookOpen } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { getStotramById, DEITY_META } from '@/lib/stotrams';
import { DEVOTIONAL_STARTER_TRACKS } from '@/lib/devotional-audio';
import { Suspense } from 'react';

// ─── Improved audio player with seek + loop ───────────────────────────────────
function AudioPanel({ trackId, autoplay, accentColor }: {
  trackId: string; autoplay: boolean; accentColor: string;
}) {
  const track = DEVOTIONAL_STARTER_TRACKS.find(t => t.id === trackId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying]   = useState(false);
  const [loop,    setLoop]      = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track?.audioUrl) return;
    audio.src = track.audioUrl;
    const onMeta  = () => setDuration(audio.duration || 0);
    const onTime  = () => setCurrent(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrent(0); };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    if (autoplay) { audio.play().then(() => setPlaying(true)).catch(() => {}); }
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [track, autoplay]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { await audio.play(); setPlaying(true); }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrent(val);
  }

  if (!track?.audioUrl) return (
    <div className="rounded-2xl px-4 py-4 text-center text-[11px]"
      style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.12)', color: 'rgba(200,146,74,0.5)' }}>
      🎵 Audio coming soon — uploading to Supabase
    </div>
  );

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-2xl px-4 py-4" style={{ background: `${accentColor}0f`, border: `1px solid ${accentColor}22` }}>
      <audio ref={audioRef} preload="metadata" />
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: accentColor }}>{track.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: `${accentColor}80` }}>{track.creator} · {track.durationLabel}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <button onClick={() => setLoop(l => !l)} title="Loop"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: loop ? `${accentColor}25` : 'transparent', border: `1px solid ${accentColor}${loop ? '50' : '20'}` }}>
            <Repeat size={12} style={{ color: loop ? accentColor : `${accentColor}55` }} />
          </button>
          <button onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}cc)` }}>
            {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" className="ml-0.5" />}
          </button>
          <button onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; setCurrent(0); } }}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ border: `1px solid ${accentColor}20` }}>
            <RotateCcw size={12} style={{ color: `${accentColor}55` }} />
          </button>
        </div>
      </div>

      {/* Seek bar */}
      <div className="space-y-1">
        <input type="range" min={0} max={duration || 100} value={current} onChange={seek} step={0.5}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor }} />
        <div className="flex justify-between text-[9px]" style={{ color: `${accentColor}60` }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main stotram reader ──────────────────────────────────────────────────────
function StotramReader({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const autoplay = searchParams.get('autoplay') === '1';

  const stotram = getStotramById(id);
  const deityMeta = stotram ? (DEITY_META[stotram.deity] ?? DEITY_META.universal) : null;
  const accentColor = deityMeta?.color ?? '#C8924A';

  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [showAll,     setShowAll]     = useState(true);

  // ── Tokens ──────────────────────────────────────────────────────────────────
  const pageBg  = isDark ? `linear-gradient(180deg,#0e0a06 0%,#160f08 100%)` : `linear-gradient(180deg,#fdf6ee 0%,#f5e8d5 100%)`;
  const cardBg  = isDark ? 'rgba(22,14,8,0.95)' : 'rgba(255,246,232,0.98)';
  const cardBdr = `${accentColor}22`;
  const textH   = isDark ? '#f5dfa0' : '#2a1002';
  const textS   = isDark ? 'rgba(245,210,130,0.48)' : 'rgba(100,55,10,0.52)';
  const textD   = isDark ? 'rgba(245,210,130,0.30)' : 'rgba(100,55,10,0.35)';

  if (!stotram) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-4xl">🙏</p>
      <p style={{ color: textS }}>Stotram not found</p>
      <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: accentColor }}>Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: pageBg }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentColor}12, transparent 70%)` }} />

      <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-4 pb-4">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}25` }}>
          <ChevronLeft size={18} style={{ color: accentColor }} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${accentColor}70` }}>
            {deityMeta?.emoji} {stotram.deity !== 'universal' ? deityMeta?.label : 'Universal'}
          </p>
          <h1 className="text-base font-semibold leading-tight truncate" style={{ fontFamily: 'var(--font-serif)', color: textH }}>
            {stotram.title}
          </h1>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Info card */}
        <div className="rounded-[1.8rem] p-5" style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{stotram.deityEmoji}</span>
            <div>
              <h2 className="font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-serif)', color: textH }}>
                {stotram.title}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: accentColor }}>{stotram.titleDevanagari}</p>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: textS }}>{stotram.description}</p>
          <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${accentColor}15` }}>
            <div><p className="text-[9px] uppercase tracking-wide" style={{ color: textD }}>Language</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: textS }}>{stotram.language}</p></div>
            <div><p className="text-[9px] uppercase tracking-wide" style={{ color: textD }}>Verses</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: textS }}>{stotram.verses.length}</p></div>
            <div className="flex-1"><p className="text-[9px] uppercase tracking-wide" style={{ color: textD }}>Source</p>
              <p className="text-[11px] font-semibold mt-0.5 leading-tight" style={{ color: textS }}>{stotram.source}</p></div>
          </div>
        </div>

        {/* Audio player */}
        {stotram.audioTrackId && (
          <AudioPanel trackId={stotram.audioTrackId} autoplay={autoplay} accentColor={accentColor} />
        )}

        {/* Verses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: textD }}>Verses</p>
            {stotram.verses.length > 1 && (
              <button onClick={() => setShowAll(v => !v)} className="text-[11px] font-semibold" style={{ color: accentColor }}>
                {showAll ? 'Collapse' : 'Expand all'}
              </button>
            )}
          </div>

          {stotram.verses.map((verse, i) => {
            const isActive = activeVerse === i || stotram.verses.length === 1;
            return (
              <motion.div key={verse.number}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}>
                <div className="rounded-[1.5rem] overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${isActive ? accentColor + '35' : cardBdr}` }}>
                  {/* Verse header */}
                  <button
                    onClick={() => setActiveVerse(isActive ? null : i)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    disabled={stotram.verses.length === 1}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: isActive ? accentColor : `${accentColor}18`, color: isActive ? '#fff' : accentColor }}>
                      {verse.number}
                    </div>
                    <p className="flex-1 text-sm font-medium leading-tight line-clamp-1 text-left" style={{ color: textH }}>
                      {verse.sanskrit.split('\n')[0]}…
                    </p>
                    {stotram.verses.length > 1 && (
                      <span className="text-xs" style={{ color: textD }}>{isActive ? '▲' : '▼'}</span>
                    )}
                  </button>

                  <AnimatePresence>
                    {(isActive || showAll) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${accentColor}12` }}>
                          {/* Sanskrit */}
                          <div className="pt-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>Sanskrit</p>
                            <p className="text-base leading-loose whitespace-pre-line text-center"
                              style={{ fontFamily: 'var(--font-deva,serif)', color: isDark ? 'rgba(245,220,150,0.85)' : 'rgba(60,30,5,0.85)', fontSize: '1.05rem' }}>
                              {verse.sanskrit}
                            </p>
                          </div>
                          {/* Transliteration */}
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>Transliteration</p>
                            <p className="text-sm leading-relaxed italic whitespace-pre-line text-center"
                              style={{ color: isDark ? 'rgba(245,210,130,0.55)' : 'rgba(80,40,8,0.60)' }}>
                              {verse.transliteration}
                            </p>
                          </div>
                          {/* Meaning */}
                          <div className="rounded-xl px-4 py-3" style={{ background: `${accentColor}08` }}>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>Meaning</p>
                            <p className="text-[12px] leading-relaxed" style={{ color: textS }}>
                              {verse.meaning}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Attribution */}
        <p className="text-center text-[10px] pb-4" style={{ color: textD }}>
          {stotram.source}
        </p>
      </div>
    </div>
  );
}

export default function StotramPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-3xl">🙏</span></div>}>
      <StotramReader id={params.id} />
    </Suspense>
  );
}
