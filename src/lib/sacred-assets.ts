/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanatana Sangam — Sacred Assets Manifest
 * ─────────────────────────────────────────────────────────────────────────────
 * Standardized utility for resolving images, audio, and text placeholders 
 * based on tradition, deity, and occasion.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type TraditionKey = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all' | 'other';

export interface AssetRequest {
  type: 'hero' | 'darshan' | 'audio' | 'icon';
  tradition?: TraditionKey;
  deity?: string;
  occasion?: string;
  isDark?: boolean;
}

const FALLBACK_SOUND = '/sounds/temple_bell.mp3';

/**
 * Standardized Path mapping
 * Structure: /assets/[type]/[tradition]/[occasion|deity].ext
 */
export const SACRED_ASSETS = {
  getHero: (tradition: TraditionKey, occasion?: string, ext: 'jpg' | 'webp' | 'png' = 'jpg') => {
    const filename = occasion || 'default';
    return `/assets/images/heroes/${tradition}/${filename}.${ext}`;
  },

  getDarshan: (deity: string, ext: 'webp' | 'png' | 'jpg' = 'webp') => {
    return `/darshan/${deity.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
  },

  getAudio: (tradition: TraditionKey, type: 'bell' | 'chant' | 'ambient' = 'bell') => {
    // Standard mapping for sounds
    const sounds: Record<TraditionKey, Record<string, string>> = {
      hindu: {
        bell: '/sounds/temple_bell.mp3',
        chant: '/sounds/om_chant.mp3',
        ambient: '/sounds/ghanta_loop.mp3'
      },
      sikh: {
        bell: '/sounds/shabad_loop.mp3', 
        chant: '/sounds/waheguru_chant.mp3',
        ambient: '/sounds/kirtan_ambient.mp3'
      },
      buddhist: {
        bell: '/sounds/singing_bowl.mp3',
        chant: '/sounds/om_mani_padme_hum.mp3',
        ambient: '/sounds/monastery_ambient.mp3'
      },
      jain: {
        bell: '/sounds/temple_bell.mp3',
        chant: '/sounds/navkar_mantra.mp3',
        ambient: '/sounds/jain_ambient.mp3'
      },
      all: { bell: '/sounds/temple_bell.mp3' },
      other: { bell: '/sounds/temple_bell.mp3' }
    };

    return sounds[tradition]?.[type] || FALLBACK_SOUND;
  }
};

/**
 * Standardized Placeholder Generator
 * Use this when the real asset is missing.
 */
export function getSacredPlaceholder(req: AssetRequest): string {
  const unsplashMap: Record<TraditionKey, string> = {
    hindu: 'https://images.unsplash.com/photo-1626078299034-909787e917d5',
    sikh: 'https://images.unsplash.com/photo-1605806616949-1e87b487fc2f',
    buddhist: 'https://images.unsplash.com/photo-1542317148-8b4398108605',
    jain: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833',
    all: 'https://images.unsplash.com/photo-1541093223450-cb5499dc18de',
    other: 'https://images.unsplash.com/photo-1541093223450-cb5499dc18de'
  };

  const base = unsplashMap[req.tradition || 'all'];
  return `${base}?q=80&w=1200&auto=format&fit=crop`;
}
