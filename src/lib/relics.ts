export interface Relic {
  id: string;
  name: string;
  description: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'universal';
  milestoneType: 'streak' | 'score';
  milestoneValue: number;
  imageUrl: string;
}

export const SACRED_RELICS: Relic[] = [
  // Universal / Early Starters
  {
    id: 'diya-bronze',
    name: 'Bronze Diya',
    description: 'A symbol of early devotion. Lit after a 3-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 3,
    imageUrl: '/relics/diya-bronze.png'
  },
  {
    id: 'sacred-mala',
    name: 'Rudraksha Mala',
    description: 'The beads of constancy. Awarded for 108 total Seva points.',
    tradition: 'universal',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/mala.png'
  },

  // Hindu Astra
  {
    id: 'trishula-gold',
    name: 'Golden Trishula',
    description: 'The trident of Shiva. Awarded for a 21-day Hindu sadhana streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/trishula-gold.png'
  },
  {
    id: 'sudarshana-chakra',
    name: 'Sudarshana Chakra',
    description: 'The wheel of cosmic order. Awarded for 1000 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 1000,
    imageUrl: '/relics/chakra.png'
  },

  // Sikh Astra
  {
    id: 'khanda-gold',
    name: 'Golden Khanda',
    description: 'The emblem of Khalsa. Awarded for a 21-day Sikh sadhana streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/khanda-gold.png'
  },

  // Buddhist Astra
  {
    id: 'dharma-wheel-gold',
    name: 'Golden Dharmachakra',
    description: 'The wheel of Dharma. Awarded for a 21-day Buddhist sadhana streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/dharma-wheel.png'
  },

  // Long Term Legend (365 Days)
  {
    id: 'the-sage-halo',
    name: 'Aura of the Sage',
    description: 'A golden halo of light. Awarded for a 365-day unbroken streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 365,
    imageUrl: '/relics/halo.png'
  }
];

export function getUnlockedRelics(streak: number, score: number, userTradition: string): Relic[] {
  return SACRED_RELICS.filter(relic => {
    const traditionMatch = relic.tradition === 'universal' || relic.tradition === userTradition;
    if (!traditionMatch) return false;

    if (relic.milestoneType === 'streak') {
      return streak >= relic.milestoneValue;
    }
    if (relic.milestoneType === 'score') {
      return score >= relic.milestoneValue;
    }
    return false;
  });
}
