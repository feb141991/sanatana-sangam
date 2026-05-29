'use client';

/**
 * MantraPlayer — zero-cost Web Speech API TTS for Sanskrit/mantra text.
 *
 * Uses the Roman transliteration for playback (far better pronunciation
 * than raw Devanagari). Prefers hi-IN / en-IN voices when available for
 * a more authentic sound for diaspora listeners.
 *
 * Props:
 *   text        — the Roman transliteration to speak
 *   label       — aria-label (e.g. "Play Gita 2.47")
 *   size        — icon size in px (default 16)
 *   className   — extra classes on the button
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

interface MantraPlayerProps {
  text: string;
  label?: string;
  size?: number;
  className?: string;
  accentColor?: string;
}

/** Pick the best available voice for Sanskrit / Indic content */
function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Priority 1 — hi-IN (Hindi sounds closest to Sanskrit for diaspora)
  const hiIn = voices.find(v => v.lang === 'hi-IN');
  if (hiIn) return hiIn;

  // Priority 2 — en-IN (Indian English, better prosody for transliteration)
  const enIn = voices.find(v => v.lang === 'en-IN');
  if (enIn) return enIn;

  // Priority 3 — any Hindi voice
  const hi = voices.find(v => v.lang.startsWith('hi'));
  if (hi) return hi;

  // Priority 4 — default
  return voices.find(v => v.default) ?? voices[0] ?? null;
}

export default function MantraPlayer({
  text,
  label = 'Play mantra audio',
  size = 16,
  className = '',
  accentColor = '#C5A059',
}: MantraPlayerProps) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying]     = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    // Some browsers load voices async — re-check after load
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        setSupported(window.speechSynthesis.getVoices().length > 0);
      };
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // When text changes mid-play, cancel
  useEffect(() => {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang  = voice?.lang ?? 'hi-IN';
    utterance.rate  = 0.82; // slightly slower — better for devotional listening
    utterance.pitch = 1.05;

    utterance.onend   = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    utterRef.current = utterance;
    window.speechSynthesis.cancel(); // clear queue
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }, [text, playing]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={play}
      aria-label={playing ? 'Stop audio' : label}
      title={playing ? 'Stop' : 'Listen to pronunciation'}
      className={`flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${className}`}
      style={{
        width:  size + 16,
        height: size + 16,
        background: playing ? `${accentColor}20` : 'transparent',
        border: `1.5px solid ${playing ? accentColor : `${accentColor}40`}`,
        color: accentColor,
      }}
    >
      {playing ? (
        <Pause size={size} strokeWidth={2.2} />
      ) : (
        <Volume2 size={size} strokeWidth={2} />
      )}
    </button>
  );
}
