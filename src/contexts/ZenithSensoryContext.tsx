'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type SensoryTheme = 'home' | 'bhakti' | 'pathshala' | 'panchang' | 'none';

interface ZenithSensoryContextType {
  theme: SensoryTheme;
  setTheme: (theme: SensoryTheme) => void;
  playHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const ZenithSensoryContext = createContext<ZenithSensoryContextType | undefined>(undefined);

// Ambiance URLs (High-quality placeholders)
const AMBIANCE_MAP: Record<SensoryTheme, string | null> = {
  home:      'https://assets.mixkit.co/sfx/preview/mixkit-distant-church-bells-ringing-585.mp3', // Placeholder for temple bells
  bhakti:    null, // Removed per user request
  pathshala: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-chimes-gentle-breeze-2718.mp3', // Placeholder for library/wind
  panchang:  'https://assets.mixkit.co/sfx/preview/mixkit-ambient-night-crickets-and-wind-2483.mp3', // Placeholder for cosmic night
  none:      null,
};

export function ZenithSensoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<SensoryTheme>('none');
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shoonaya-sensory-muted') === 'true';
    }
    return false;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist mute state
  useEffect(() => {
    localStorage.setItem('shoonaya-sensory-muted', String(isMuted));
  }, [isMuted]);

  // Automatically switch theme based on route
  useEffect(() => {
    if (pathname.includes('/bhakti')) setTheme('bhakti');
    else if (pathname.includes('/pathshala')) setTheme('pathshala');
    else if (pathname.includes('/panchang')) setTheme('panchang');
    else if (pathname === '/' || pathname.includes('/home')) setTheme('home');
    else setTheme('none');
  }, [pathname]);

  // Handle Audio Transitions
  useEffect(() => {
    const url = AMBIANCE_MAP[theme];
    
    if (!url || isMuted) {
      if (audioRef.current) {
        // Fade out
        const audio = audioRef.current;
        let vol = audio.volume;
        const fade = setInterval(() => {
          if (vol > 0.05) {
            vol -= 0.05;
            audio.volume = vol;
          } else {
            audio.pause();
            clearInterval(fade);
          }
        }, 50);
      }
      return;
    }

    // New Audio
    if (audioRef.current) audioRef.current.pause();
    
    const newAudio = new Audio(url);
    newAudio.loop = true;
    newAudio.volume = 0;
    audioRef.current = newAudio;
    
    const playPromise = newAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Fade in
        let vol = 0;
        const fade = setInterval(() => {
          if (vol < 0.15) { // Keep ambiance subtle
            vol += 0.02;
            newAudio.volume = vol;
          } else {
            clearInterval(fade);
          }
        }, 100);
      }).catch(e => console.warn('[ZenithSensory] Audio blocked by browser policy:', e));
    }

    return () => {
      newAudio.pause();
    };
  }, [theme, isMuted]);

  const playHaptic = (type: 'light' | 'medium' | 'heavy') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 30,
        heavy: [50, 30, 50],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  return (
    <ZenithSensoryContext.Provider value={{ theme, setTheme, playHaptic, isMuted, setIsMuted }}>
      {children}
    </ZenithSensoryContext.Provider>
  );
}

export const useZenithSensory = () => {
  const context = useContext(ZenithSensoryContext);
  if (!context) throw new Error('useZenithSensory must be used within a ZenithSensoryProvider');
  return context;
};
