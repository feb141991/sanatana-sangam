'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';
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

  const [trackId, setTrackId] = useState<string | undefined>(defaultTrack);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!trackId && tracks[0]?.id) setTrackId(tracks[0].id);
  }, [trackId, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

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

  if (!activeTrack) return null;

  return (
    <div className={`rounded-[1.45rem] border border-[color:var(--brand-primary-soft)] bg-white/90 ${compact ? 'px-3 py-3' : 'px-4 py-4'}`}>
      <audio ref={audioRef} preload="none" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[color:var(--brand-primary)]">{title}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{activeTrack.title}</p>
          <p className="mt-1 text-xs text-gray-500">{activeTrack.creator} · {activeTrack.durationLabel}</p>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sacred"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}
          aria-label={playing ? 'Pause chant' : 'Play chant'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
      </div>

      {tracks.length > 1 && (
        <select
          value={activeTrack.id}
          onChange={(event) => {
            audioRef.current?.pause();
            setPlaying(false);
            setTrackId(event.target.value);
          }}
          className="mt-3 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: 'rgba(20,14,8,0.9)', borderColor: 'rgba(200,146,74,0.2)', color: 'rgba(240,210,160,0.8)', colorScheme: 'dark' }}
        >
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>{track.title}</option>
          ))}
        </select>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
          <Volume2 size={13} />
          <span>{activeTrack.sourceName}</span>
        </div>
        <a
          href={activeTrack.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-[color:var(--brand-primary-strong)]"
        >
          Source
        </a>
      </div>
    </div>
  );
}
