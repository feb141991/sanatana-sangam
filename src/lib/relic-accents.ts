export const RELIC_ACCENTS: Record<string, {
  primary: string;   // main accent (replaces #C5A059)
  soft: string;      // soft version (10% opacity background)
  glow: string;      // glow shadow colour
}> = {
  // Defaults to amber for most relics — only distinctive ones override
  'the-sage-halo':      { primary: '#FFD700', soft: 'rgba(255,215,0,0.10)',  glow: 'rgba(255,215,0,0.25)'  },
  'chintamani-gem':     { primary: '#64DCA8', soft: 'rgba(100,220,168,0.10)',glow: 'rgba(100,220,168,0.25)'},
  'sudarshana-chakra':  { primary: '#FFB800', soft: 'rgba(255,184,0,0.10)',  glow: 'rgba(255,184,0,0.25)'  },
  'durga-shield':       { primary: '#FF7832', soft: 'rgba(255,120,50,0.10)', glow: 'rgba(255,120,50,0.25)' },
  'krishna-flute':      { primary: '#5BA4CF', soft: 'rgba(91,164,207,0.10)', glow: 'rgba(91,164,207,0.25)' },
  'vajra-scepter':      { primary: '#6495FF', soft: 'rgba(100,149,255,0.10)',glow: 'rgba(100,149,255,0.25)'},
  'dharma-wheel-gold':  { primary: '#DC6400', soft: 'rgba(220,100,0,0.10)',  glow: 'rgba(220,100,0,0.25)'  },
  'khanda-gold':        { primary: '#0080C8', soft: 'rgba(0,128,200,0.10)',  glow: 'rgba(0,128,200,0.25)'  },
};

export const DEFAULT_ACCENT = {
  primary: '#C5A059',
  soft: 'rgba(197,160,89,0.10)',
  glow: 'rgba(197,160,89,0.25)',
};

export function getRelicAccent(activeSymbolId: string | null | undefined) {
  if (!activeSymbolId) return DEFAULT_ACCENT;
  return RELIC_ACCENTS[activeSymbolId] ?? DEFAULT_ACCENT;
}
