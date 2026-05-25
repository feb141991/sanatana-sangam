export const RELIC_FRAMES: Record<string, {
  border: string;
  shadow: string;
  pattern?: string;
}> = {
  'sacred-mala': { border: '2px solid rgba(139,90,60,0.8)', shadow: '0 0 0 3px rgba(139,90,60,0.15)' },
  'shankha-conch': { border: '2px solid rgba(220,220,255,0.7)', shadow: '0 0 8px rgba(180,180,255,0.25)' },
  'the-sage-halo': { border: '2.5px solid rgba(255,215,0,0.9)', shadow: '0 0 16px rgba(255,215,0,0.35), 0 0 32px rgba(255,215,0,0.15)' },
  'trishula-gold': { border: '2px solid rgba(197,160,89,0.85)', shadow: '0 0 10px rgba(197,160,89,0.3)' },
  'durga-shield': { border: '2px solid rgba(255,120,50,0.8)', shadow: '0 0 12px rgba(255,120,50,0.25)' },
  'sudarshana-chakra': { border: '2.5px solid rgba(255,180,0,0.9)', shadow: '0 0 14px rgba(255,180,0,0.35)' },
  'chintamani-gem': { border: '3px solid rgba(100,220,180,0.9)', shadow: '0 0 20px rgba(100,220,180,0.4), 0 0 40px rgba(100,220,180,0.2)' },
  'khanda-gold': { border: '2px solid rgba(0,128,200,0.8)', shadow: '0 0 10px rgba(0,128,200,0.25)' },
  'deg-teg': { border: '2px solid rgba(30,160,100,0.8)', shadow: '0 0 10px rgba(30,160,100,0.25)' },
  'dharma-wheel-gold': { border: '2px solid rgba(220,100,0,0.8)', shadow: '0 0 12px rgba(220,100,0,0.25)' },
  'vajra-scepter': { border: '2px solid rgba(100,160,255,0.85)', shadow: '0 0 14px rgba(100,160,255,0.3)' },
  'siddhachakra-wheel': { border: '2px solid rgba(200,200,255,0.8)', shadow: '0 0 12px rgba(200,200,255,0.25)' },
  'three-jewels': { border: '2px solid rgba(100,220,120,0.8)', shadow: '0 0 10px rgba(100,220,120,0.25)' },
  default: { border: '2px solid rgba(197,160,89,0.4)', shadow: 'none' },
};

export function getRelicFrame(activeSymbolId: string | null | undefined) {
  if (!activeSymbolId) return null;
  return RELIC_FRAMES[activeSymbolId] ?? RELIC_FRAMES.default;
}
