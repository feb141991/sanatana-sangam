'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Repeat, Volume2 } from 'lucide-react';
import { APPROVED_DEVOTIONAL_TRACKS, DEVOTIONAL_STARTER_TRACKS } from '@/lib/devotional-audio';
import { playBeadTapFeedback } from '@/lib/practice-feedback';

type Props = {
  title?: string;
  trackIds?: string[];
  initialTrackId?: string;
  compact?: boolean;
};

export default function ChantAudioPlayer({
  title = 'Chant player',
  trackIds,
  initialTrackId,
  compact = false,
}: Props) {
  const tracks = useMemo(() => {
    const source = trackIds?.length
      ? DEVOTIONAL_STARTER_TRACKS.filter((track) => trackIds.includes(track.id))
      : APPROVED_DEVOTIONAL_TRACKS;
    return source.filter((track) => !!track.audioUrl);
  }, [trackIds]);

  const defaultTrack = initialTrackId && tracks.find((track) => track.id === initialTrackId)
    ? initialTrackId
    : tracks[0]?.id;

  const [trackId,  setTrackId]  = useState<string | undefined>(defaultTrack);
  const [playing,  setPlaying]  = useState(false);
  const [loop,     setLoop]     = useState(false);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback: set first track when tracks load
  useEffect(() => {
    if (!trackId && tracks[0]?.id) setTrackId(tracks[0].id);
  }, [trackId, tracks]);

  // Wire audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onMeta  = () => setDuration(audio.duration || 0);
    const onTime  = () => setCurrent(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrent(0); };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Sync loop to audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  const activeTrack = tracks.find((track) => track.id === trackId) ?? null;

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;
    playBeadTapFeedback();
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.src = activeTrack.audioUrl;
    await audio.play();
    setPlaying(true);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrent(0);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  if (!activeTrack) {
    return (
      <div className="surface-card px-4 py-4 text-center text-xs" style={{ color: 'rgba(200,146,74,0.5)' }}>
        🎵 Audio coming soon
      </div>
    );
  }

  return (
    <div className={`surface-card ${compact ? 'px-3 py-3' : 'px-4 py-4'}`}>
      <audio ref={audioRef} preload="metadata" />

      {/* Track info + controls */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[color:var(--brand-primary)]">{title}</p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--text-cream)]">{activeTrack.title}</p>
          <p className="mt-0.5 text-xs text-[color:var(--brand-muted)]">{activeTrack.creator} · {activeTrack.durationLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Loop */}
          <button type="button" onClick={() => setLoop(l => !l)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
            style={{ background: loop ? 'rgba(200,146,74,0.18)' : 'transparent', border: '1px solid rgba(200,146,74,0.20)' }}
            aria-label="Toggle loop">
            <Repeat size={13} style={{ color: loop ? 'var(--brand-primary)' : 'rgba(200,146,74,0.40)' }} />
          </button>
          {/* Restart */}
          <button type="button" onClick={restart}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ border: '1px solid rgba(200,146,74,0.18)' }}
            aria-label="Restart track">
            <RotateCcw size={13} style={{ color: 'rgba(200,146,74,0.40)' }} />
          </button>
          {/* Play/Pause */}
          <button type="button" onClick={togglePlayback}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sacred"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}
            aria-label={playing ? 'Pause chant' : 'Play chant'}>
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Seek bar */}
      {duration > 0 && (
        <div className="mt-3 space-y-1">
          <input type="range" min={0} max={duration} value={current} step={0.5} onChange={seek}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: 'var(--brand-primary)' }} />
          <div className="flex justify-between text-[9px]" style={{ color: 'rgba(200,146,74,0.45)' }}>
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      )}

      {/* Track selector */}
      {tracks.length > 1 && (
        <div className="mt-3 space-y-1">
          {tracks.map((track) => (
            <button key={track.id} type="button"
              onClick={() => {
                audioRef.current?.pause();
                setPlaying(false);
                setTrackId(track.id);
                setCurrent(0);
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-all"
              style={{
                background: track.id === trackId ? 'rgba(200,146,74,0.12)' : 'transparent',
                border: `1px solid ${track.id === trackId ? 'rgba(200,146,74,0.28)' : 'transparent'}`,
              }}>
              <span className="text-base leading-none">{track.id === trackId && playing ? '▶' : '○'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: track.id === trackId ? 'var(--brand-primary)' : 'var(--brand-muted)' }}>
                  {track.title}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(200,146,74,0.40)' }}>
                  {track.creator} · {track.durationLabel}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Attribution */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs text-[color:var(--brand-muted)]">
          <Volume2 size={12} />
          <span>{activeTrack.sourceName}</span>
        </div>
        <a href={activeTrack.sourceUrl} target="_blank" rel="noreferrer"
          className="text-xs font-semibold text-[color:var(--brand-primary-strong)]">
          Source ↗
        </a>
      </div>
    </div>
  );
}
