import { useState, useEffect, useRef, useCallback } from 'react';

export interface SyncToken {
  start: number; // ms
  end: number;   // ms
  word: string;
}

interface UseSacredSyncProps {
  audioUrl: string;
  tokens: SyncToken[];
  onComplete?: () => void;
}

export function useSacredSync({ audioUrl, tokens, onComplete }: UseSacredSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number>();

  // High-precision animation loop (60fps)
  const animate = useCallback(() => {
    if (!audioRef.current) return;
    
    const currentMs = audioRef.current.currentTime * 1000;
    setCurrentTime(currentMs);

    // Find the active token
    const index = tokens.findIndex(t => currentMs >= t.start && currentMs <= t.end);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [tokens, activeIndex]);

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    
    const audio = audioRef.current;
    
    const handleEnded = () => {
      setIsPlaying(false);
      setActiveIndex(-1);
      if (onComplete) onComplete();
    };

    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [audioUrl, onComplete]);

  const toggle = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      audioRef.current.play();
      requestRef.current = requestAnimationFrame(animate);
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (ms: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = ms / 1000;
    setCurrentTime(ms);
  };

  return {
    isPlaying,
    currentTime,
    activeIndex,
    toggle,
    seek,
    progress: audioRef.current ? (currentTime / (audioRef.current.duration * 1000)) * 100 : 0
  };
}
