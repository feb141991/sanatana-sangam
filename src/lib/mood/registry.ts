export interface MoodConfig {
  key: string;
  label: string;
  colour: string;
  bg: string;
}

export const MOODS_CONFIG: Record<'dark' | 'light', MoodConfig[]> = {
  dark: [
    { key: 'anxious',     label: 'Anxious',      colour: '#A594E0', bg: 'rgba(165,148,224,0.12)' },
    { key: 'grieving',    label: 'Grieving',      colour: '#84A9FF', bg: 'rgba(132,169,255,0.12)' },
    { key: 'angry',       label: 'Angry',         colour: '#FF8A65', bg: 'rgba(255,138,101,0.12)' },
    { key: 'scattered',   label: 'Scattered',     colour: '#81C784', bg: 'rgba(129,199,132,0.12)' },
    { key: 'lost',        label: 'Lost',          colour: '#B0BEC5', bg: 'rgba(176,190,197,0.12)' },
    { key: 'joyful',      label: 'Joyful',        colour: '#FFD54F', bg: 'rgba(255,213,79,0.12)'  },
    { key: 'seeking',     label: 'Seeking',       colour: '#FFB74D', bg: 'rgba(255,183,77,0.12)'  },
    { key: 'lonely',      label: 'Lonely',        colour: '#4DD0E1', bg: 'rgba(77,208,225,0.12)'  },
    { key: 'overwhelmed', label: 'Overwhelmed',   colour: '#64B5F6', bg: 'rgba(100,181,246,0.12)' },
    { key: 'grateful',    label: 'Grateful',      colour: '#D4E157', bg: 'rgba(212,225,87,0.12)'  },
  ],
  light: [
    { key: 'anxious',     label: 'Anxious',      colour: '#5E4B8B', bg: 'rgba(94,75,139,0.08)' },
    { key: 'grieving',    label: 'Grieving',      colour: '#3F51B5', bg: 'rgba(63,81,181,0.08)' },
    { key: 'angry',       label: 'Angry',         colour: '#BF360C', bg: 'rgba(191,54,12,0.08)'  },
    { key: 'scattered',   label: 'Scattered',     colour: '#2E7D32', bg: 'rgba(46,125,50,0.08)'  },
    { key: 'lost',        label: 'Lost',          colour: '#455A64', bg: 'rgba(69,90,100,0.08)'  },
    { key: 'joyful',      label: 'Joyful',        colour: '#E65100', bg: 'rgba(230,81,0,0.08)'   },
    { key: 'seeking',     label: 'Seeking',       colour: '#EF6C00', bg: 'rgba(239,108,0,0.08)'  },
    { key: 'lonely',      label: 'Lonely',        colour: '#00838F', bg: 'rgba(0,131,143,0.08)'  },
    { key: 'overwhelmed', label: 'Overwhelmed',   colour: '#1565C0', bg: 'rgba(21,101,192,0.08)' },
    { key: 'grateful',    label: 'Grateful',      colour: '#827717', bg: 'rgba(130,119,23,0.08)'  },
  ]
};
