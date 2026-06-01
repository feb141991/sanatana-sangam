export const RELIC_ACCENTS: Record<string, {
  primary: string;   // main accent (replaces #C5A059)
  soft: string;      // soft version (10% opacity background)
  glow: string;      // glow shadow colour
}> = {
  // ── Existing correct entries (kept unchanged) ──
  'the-sage-halo':      { primary: '#FFD700', soft: 'rgba(255,215,0,0.10)',  glow: 'rgba(255,215,0,0.25)'  },
  'chintamani-gem':     { primary: '#64DCA8', soft: 'rgba(100,220,168,0.10)',glow: 'rgba(100,220,168,0.25)'},
  'sudarshana-chakra':  { primary: '#FFB800', soft: 'rgba(255,184,0,0.10)',  glow: 'rgba(255,184,0,0.25)'  },
  'durga-shield':       { primary: '#FF7832', soft: 'rgba(255,120,50,0.10)', glow: 'rgba(255,120,50,0.25)' },
  'krishna-flute':      { primary: '#5BA4CF', soft: 'rgba(91,164,207,0.10)', glow: 'rgba(91,164,207,0.25)' },
  'vajra-scepter':      { primary: '#6495FF', soft: 'rgba(100,149,255,0.10)',glow: 'rgba(100,149,255,0.25)'},
  'dharma-wheel-gold':  { primary: '#DC6400', soft: 'rgba(220,100,0,0.10)',  glow: 'rgba(220,100,0,0.25)'  },
  'khanda-gold':        { primary: '#0080C8', soft: 'rgba(0,128,200,0.10)',  glow: 'rgba(0,128,200,0.25)'  },

  // ── Universal Relics (Warm Amber/Gold Tones) ──
  'diya-bronze':        { primary: '#D29034', soft: 'rgba(210,144,52,0.10)',  glow: 'rgba(210,144,52,0.25)'  },
  'clay-kalash':        { primary: '#D97D4B', soft: 'rgba(217,125,75,0.10)',  glow: 'rgba(217,125,75,0.25)'  },
  'incense-sandalwood': { primary: '#D4AD68', soft: 'rgba(212,173,104,0.10)', glow: 'rgba(212,173,104,0.25)' },
  'camphor-flame':      { primary: '#FFE57F', soft: 'rgba(255,229,127,0.10)', glow: 'rgba(255,229,127,0.25)' },
  'mindful-bell':       { primary: '#CDA250', soft: 'rgba(205,162,80,0.10)',  glow: 'rgba(205,162,80,0.25)'  },
  'copper-lota':        { primary: '#D87040', soft: 'rgba(216,112,64,0.10)',  glow: 'rgba(216,112,64,0.25)'  },
  'asana-kusha':        { primary: '#B5A642', soft: 'rgba(181,166,66,0.10)',  glow: 'rgba(181,166,66,0.25)'  },
  'sacred-mala':        { primary: '#A06A38', soft: 'rgba(160,106,56,0.10)',  glow: 'rgba(160,106,56,0.25)'  },
  'shankha-conch':      { primary: '#E5D3B3', soft: 'rgba(229,211,179,0.10)', glow: 'rgba(229,211,179,0.25)' },
  'prarthana-pothi':    { primary: '#E6C229', soft: 'rgba(230,194,41,0.10)',  glow: 'rgba(230,194,41,0.25)'  },

  // ── Hindu Relics (Saffron, Reds, Oranges, Deity Colours) ──
  'ganesha-modak':      { primary: '#FF9100', soft: 'rgba(255,145,0,0.10)',   glow: 'rgba(255,145,0,0.25)'   },
  'vibhuti-ash':        { primary: '#A0B2C6', soft: 'rgba(160,178,198,0.10)', glow: 'rgba(160,178,198,0.25)' },
  'trishula-gold':      { primary: '#FFC107', soft: 'rgba(255,193,7,0.10)',   glow: 'rgba(255,193,7,0.25)'   },
  'rama-bow':           { primary: '#D32F2F', soft: 'rgba(211,47,47,0.10)',   glow: 'rgba(211,47,47,0.25)'   },
  'peacock-feather':    { primary: '#00ACC1', soft: 'rgba(0,172,193,0.10)',   glow: 'rgba(0,172,193,0.25)'   },
  'ananta-shesha':      { primary: '#7E57C2', soft: 'rgba(126,87,194,0.10)',  glow: 'rgba(126,87,194,0.25)'  },
  'tulsi-leaf':         { primary: '#4CAF50', soft: 'rgba(76,175,80,0.10)',   glow: 'rgba(76,175,80,0.25)'   },
  'shiva-damaru':       { primary: '#C62828', soft: 'rgba(198,40,40,0.10)',   glow: 'rgba(198,40,40,0.25)'   },
  'nandi-devotion':     { primary: '#F5F5DC', soft: 'rgba(245,245,220,0.10)', glow: 'rgba(245,245,220,0.25)' },
  'brahma-lotus':       { primary: '#EC407A', soft: 'rgba(236,64,122,0.10)',  glow: 'rgba(236,64,122,0.25)'  },
  'hanuman-gada':       { primary: '#FF6F00', soft: 'rgba(255,111,0,0.10)',   glow: 'rgba(255,111,0,0.25)'   },
  'ganga-kalash':       { primary: '#FFD54F', soft: 'rgba(255,213,79,0.10)',  glow: 'rgba(255,213,79,0.25)'  },
  'rishi-kamandalu':    { primary: '#E65100', soft: 'rgba(230,81,0,0.10)',    glow: 'rgba(230,81,0,0.25)'    },

  // ── Sikh Relics (Steel Blue, Navy, Teal Tones) ──
  'steel-kara':         { primary: '#78909C', soft: 'rgba(120,144,156,0.10)', glow: 'rgba(120,144,156,0.25)' },
  'sacred-kirpan':      { primary: '#4682B4', soft: 'rgba(70,130,180,0.10)',  glow: 'rgba(70,130,180,0.25)'  },
  'sikh-chaur':         { primary: '#009688', soft: 'rgba(0,150,136,0.10)',   glow: 'rgba(0,150,136,0.25)'   },
  'kartarpur-nishan':   { primary: '#1565C0', soft: 'rgba(21,101,192,0.10)',  glow: 'rgba(21,101,192,0.25)'  },
  'wooden-kangha':      { primary: '#8D6E63', soft: 'rgba(141,110,99,0.10)',  glow: 'rgba(141,110,99,0.25)'  },
  'nishan-sahib':       { primary: '#0D47A1', soft: 'rgba(13,71,161,0.10)',   glow: 'rgba(13,71,161,0.25)'   },
  'deg-teg':            { primary: '#00695C', soft: 'rgba(0,105,92,0.10)',    glow: 'rgba(0,105,92,0.25)'    },
  'gurbani-pothi':      { primary: '#1A237E', soft: 'rgba(26,35,126,0.10)',   glow: 'rgba(26,35,126,0.25)'   },

  // ── Buddhist Relics (Amber, Terracotta, Lotus Pink, Earth Tones) ──
  'lotus-bloom':        { primary: '#F48FB1', soft: 'rgba(244,143,177,0.10)', glow: 'rgba(244,143,177,0.25)' },
  'alms-bowl':          { primary: '#BF360C', soft: 'rgba(191,54,12,0.10)',   glow: 'rgba(191,54,12,0.25)'   },
  'treasure-vase':      { primary: '#FFA000', soft: 'rgba(255,160,0,0.10)',   glow: 'rgba(255,160,0,0.25)'   },
  'golden-fish':        { primary: '#FF8F00', soft: 'rgba(255,143,0,0.10)',   glow: 'rgba(255,143,0,0.25)'   },
  'bodhi-leaf':         { primary: '#9CCC65', soft: 'rgba(156,204,101,0.10)', glow: 'rgba(156,204,101,0.25)' },
  'prayer-wheel':       { primary: '#A1887F', soft: 'rgba(161,136,127,0.10)', glow: 'rgba(161,136,127,0.25)' },
  'parasol-royalty':    { primary: '#FBC02D', soft: 'rgba(251,192,45,0.10)',  glow: 'rgba(251,192,45,0.25)'  },

  // ── Jain Relics (Sage Green, White-Gold, Silver Tones) ──
  'jain-swastika':      { primary: '#FFFDD0', soft: 'rgba(255,253,208,0.10)', glow: 'rgba(255,253,208,0.25)' },
  'peacock-brush':      { primary: '#81C784', soft: 'rgba(129,199,132,0.10)', glow: 'rgba(129,199,132,0.25)' },
  'siddhashila-moon':   { primary: '#CFD8DC', soft: 'rgba(207,216,220,0.10)', glow: 'rgba(207,216,220,0.25)' },
  'ahimsa-hand':        { primary: '#E8EAF6', soft: 'rgba(232,234,246,0.10)', glow: 'rgba(232,234,246,0.25)' },
  'three-jewels':       { primary: '#66BB6A', soft: 'rgba(102,187,106,0.10)', glow: 'rgba(102,187,106,0.25)' },
  'siddhachakra-wheel': { primary: '#B0BEC5', soft: 'rgba(176,190,197,0.10)', glow: 'rgba(176,190,197,0.25)' },
  'jain-kalasha':       { primary: '#FFF59D', soft: 'rgba(255,245,157,0.10)', glow: 'rgba(255,245,157,0.25)' },
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
