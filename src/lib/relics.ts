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
  // ── UNIVERSAL / GENERAL SEEKER RELICS ──
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
    id: 'clay-kalash',
    name: 'Clay Kalash',
    description: 'A vessel of reception representing the empty mind, ready for wisdom. Awarded for a 5-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/clay-kalash.png'
  },
  {
    id: 'incense-sandalwood',
    name: 'Sandalwood Incense',
    description: 'The fragrance of tranquil presence, purifying your daily workspace. Awarded for a 7-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 7,
    imageUrl: '/relics/incense.png'
  },
  {
    id: 'camphor-flame',
    name: 'Camphor Flame',
    description: 'A blazing light of awareness that leaves no residue of ego. Awarded for a 10-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 10,
    imageUrl: '/relics/camphor.png'
  },
  {
    id: 'mindful-bell',
    name: 'Bell of Ghanta',
    description: 'Dispeller of heavy energies and caller of pure focus. Awarded for a 14-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 14,
    imageUrl: '/relics/bell.png'
  },
  {
    id: 'copper-lota',
    name: 'Copper Lota',
    description: 'A pure vessel of copper representing physical purification and elemental balance. Awarded for a 30-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 30,
    imageUrl: '/relics/copper-lota.png'
  },
  {
    id: 'asana-kusha',
    name: 'Kusha Grass Asana',
    description: 'The ancient meditation seat of sages, insulating the seeker from distracting earthly currents. Awarded for a 50-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/asana.png'
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
  {
    id: 'shankha-conch',
    name: 'Sacred Shankha',
    description: 'The primal sound of creation, dispelling negative vibrations. Awarded for 250 total Seva points.',
    tradition: 'universal',
    milestoneType: 'score',
    milestoneValue: 250,
    imageUrl: '/relics/shankha.png'
  },
  {
    id: 'prarthana-pothi',
    name: 'Devotional Pothi',
    description: 'A compilation of early prayers and daily verses. Awarded for 500 total Seva points.',
    tradition: 'universal',
    milestoneType: 'score',
    milestoneValue: 500,
    imageUrl: '/relics/pothi.png'
  },
  {
    id: 'the-sage-halo',
    name: 'Aura of the Sage',
    description: 'A golden halo of light. Awarded for a 365-day unbroken streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 365,
    imageUrl: '/relics/halo.png'
  },

  // ── HINDU RELICS ──
  {
    id: 'ganesha-modak',
    name: 'Modak of Wisdom',
    description: 'Ganesha\'s sweet reward of single-minded focus and removal of obstacles. Awarded for a 5-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/modak.png'
  },
  {
    id: 'vibhuti-ash',
    name: 'Sacred Vibhuti',
    description: 'Pure ash of Shiva\'s dhuni, reminding us of our ultimate spiritual form. Awarded for a 9-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 9,
    imageUrl: '/relics/vibhuti.png'
  },
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
    id: 'krishna-flute',
    name: 'Krishna\'s Flute',
    description: 'The hollow reed of pure devotion, drawing the soul to absolute divine love. Awarded for a 30-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 30,
    imageUrl: '/relics/flute.png'
  },
  {
    id: 'rama-bow',
    name: 'Bow of Sri Rama',
    description: 'Kodanda, representing unswerving righteousness (Dharma) and absolute precision. Awarded for a 50-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/bow.png'
  },
  {
    id: 'peacock-feather',
    name: 'Peacock Feather',
    description: 'The crown jewel of Krishna, representing beauty, purity, and play. Awarded for a 75-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 75,
    imageUrl: '/relics/peacock.png'
  },
  {
    id: 'durga-shield',
    name: 'Shield of Durga',
    description: 'Invincible protective energy shield of the Divine Mother. Awarded for a 108-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/shield.png'
  },
  {
    id: 'ananta-shesha',
    name: 'Ananta Shesha Canopy',
    description: 'The infinite cosmic serpent providing shelter to your deep meditation. Awarded for a 200-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 200,
    imageUrl: '/relics/shesha.png'
  },
  {
    id: 'tulsi-leaf',
    name: 'Sacred Tulsi Leaf',
    description: 'The divine plant of Vishnu, embodying absolute healing and selfless service. Awarded for 108 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/tulsi.png'
  },
  {
    id: 'shiva-damaru',
    name: 'Damaru of Shiva',
    description: 'The cosmic drum beating the steady rhythm of transformation. Awarded for 300 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 300,
    imageUrl: '/relics/damaru.png'
  },
  {
    id: 'nandi-devotion',
    name: 'Steadfast Nandi',
    description: 'The calm devotion of Nandi, constantly focused on the Divine. Awarded for 450 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 450,
    imageUrl: '/relics/nandi.png'
  },
  {
    id: 'brahma-lotus',
    name: 'Lotus of Brahma',
    description: 'The pure flower of creation and self-expansion. Awarded for 600 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 600,
    imageUrl: '/relics/lotus.png'
  },
  {
    id: 'hanuman-gada',
    name: 'Gada of Hanuman',
    description: 'The golden mace of strength, service, and absolute humility. Awarded for 800 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 800,
    imageUrl: '/relics/gada.png'
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
  {
    id: 'ganga-kalash',
    name: 'Ganga Kalash',
    description: 'A pure golden urn filled with the holy waters of the Ganges, representing flow and purification. Awarded for 1500 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 1500,
    imageUrl: '/relics/ganga-urn.png'
  },
  {
    id: 'rishi-kamandalu',
    name: 'Rishi Kamandalu',
    description: 'The ascetic\'s water pot, representing renunciation of luxuries and absolute contentment. Awarded for 2500 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 2500,
    imageUrl: '/relics/kamandalu.png'
  },
  {
    id: 'chintamani-gem',
    name: 'Chintamani Gem',
    description: 'The mythical wish-fulfilling jewel, symbolizing the supreme peace of self-knowledge. Awarded for 5000 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 5000,
    imageUrl: '/relics/chintamani.png'
  },

  // ── SIKH RELICS ──
  {
    id: 'steel-kara',
    name: 'Steel Kara',
    description: 'The iron bracelet representing infinity, eternity, and restraint in actions. Awarded for a 5-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/kara.png'
  },
  {
    id: 'sacred-kirpan',
    name: 'Sacred Kirpan',
    description: 'The sword of mercy and defense of the weak. Awarded for an 11-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 11,
    imageUrl: '/relics/kirpan.png'
  },
  {
    id: 'khanda-gold',
    name: 'Golden Khanda',
    description: 'The emblem of Khalsa. Awarded for a 21-day Sikh sadhana streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/khanda-gold.png'
  },
  {
    id: 'sikh-chaur',
    name: 'Chaur Sahib',
    description: 'The fly-whisk of royal reverence waved over the Guru Granth Sahib, representing humility. Awarded for a 50-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/chaur.png'
  },
  {
    id: 'kartarpur-nishan',
    name: 'Nishan of Kartarpur',
    description: 'Awarded for exceptional dedication to selfless service and Kirat Karo (honest labor). Awarded for a 108-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/nishan-kartarpur.png'
  },
  {
    id: 'wooden-kangha',
    name: 'Wooden Kangha',
    description: 'The clean wooden comb, representing order, mental discipline, and cleanliness. Awarded for 108 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/kangha.png'
  },
  {
    id: 'nishan-sahib',
    name: 'Golden Nishan Sahib',
    description: 'The high banner of truth, sovereignty, and shelter. Awarded for 350 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 350,
    imageUrl: '/relics/nishan-banner.png'
  },
  {
    id: 'deg-teg',
    name: 'Deg and Teg',
    description: 'The cauldron (food for all) and sword (protection for all), representing Khalsa hospitality. Awarded for 600 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 600,
    imageUrl: '/relics/deg-teg.png'
  },
  {
    id: 'gurbani-pothi',
    name: 'Pothi of Gurbani',
    description: 'A beautifully preserved manuscript of the Guru\'s hymns. Awarded for 1000 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 1000,
    imageUrl: '/relics/gurbani-manuscript.png'
  },

  // ── BUDDHIST RELICS ──
  {
    id: 'lotus-bloom',
    name: 'Lotus Bloom',
    description: 'Rising out of the mud of samsara to blossom in the sunlight of awakening. Awarded for a 5-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/lotus-bloom.png'
  },
  {
    id: 'alms-bowl',
    name: 'Alms Bowl (Patra)',
    description: 'The monk\'s bowl representing physical detachment and absolute receptivity. Awarded for a 12-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 12,
    imageUrl: '/relics/bowl.png'
  },
  {
    id: 'dharma-wheel-gold',
    name: 'Golden Dharmachakra',
    description: 'The wheel of Dharma. Awarded for a 21-day Buddhist sadhana streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/dharma-wheel.png'
  },
  {
    id: 'treasure-vase',
    name: 'Treasure Vase',
    description: 'The vessel containing infinite spiritual treasures of health and wisdom. Awarded for a 50-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/vase.png'
  },
  {
    id: 'golden-fish',
    name: 'Pair of Golden Fish',
    description: 'Representing fearless movement and liberation through the deep waters of samsara. Awarded for a 108-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/fish.png'
  },
  {
    id: 'bodhi-leaf',
    name: 'Bodhi Leaf',
    description: 'A leaf of the sacred fig tree under which Gautama attained enlightenment. Awarded for 108 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/bodhi-leaf.png'
  },
  {
    id: 'prayer-wheel',
    name: 'Prayer Wheel',
    description: 'Embodying the continuous turning of the wheel of compassion. Awarded for 400 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 400,
    imageUrl: '/relics/prayer-wheel.png'
  },
  {
    id: 'vajra-scepter',
    name: 'Vajra Scepter',
    description: 'The thunderbolt of diamond clarity that shatters delusion and illusion. Awarded for 750 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 750,
    imageUrl: '/relics/vajra.png'
  },
  {
    id: 'parasol-royalty',
    name: 'Royalty Parasol',
    description: 'Providing protective shelter from the burning heat of desire and anger. Awarded for 1200 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 1200,
    imageUrl: '/relics/parasol.png'
  },

  // ── JAIN RELICS ──
  {
    id: 'jain-swastika',
    name: 'Jinendra Swastika',
    description: 'Representing the four states of cycle existence (Gatis) and the absolute path to liberation. Awarded for a 5-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/swastika.png'
  },
  {
    id: 'peacock-brush',
    name: 'Peacock Brush',
    description: 'Rajoharan, used by monks to gently clean paths of microscopic life, embodying absolute Ahimsa. Awarded for a 15-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 15,
    imageUrl: '/relics/peacock-brush.png'
  },
  {
    id: 'siddhashila-moon',
    name: 'Crescent of Siddhashila',
    description: 'Representing the absolute peak of the universe where liberated souls rest in pure bliss. Awarded for a 30-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 30,
    imageUrl: '/relics/crescent.png'
  },
  {
    id: 'ahimsa-hand',
    name: 'Ahimsakar Hand',
    description: 'The palm with the wheel of Dharma, representing absolute non-violence and vigilance. Awarded for a 108-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/ahimsa-hand.png'
  },
  {
    id: 'three-jewels',
    name: 'Three Jewels (Triratna)',
    description: 'Samyak Darshana (Faith), Samyak Jnana (Knowledge), and Samyak Charitra (Conduct). Awarded for 108 Jain Seva points.',
    tradition: 'jain',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/triratna.png'
  },
  {
    id: 'siddhachakra-wheel',
    name: 'Siddhachakra Wheel',
    description: 'The sacred mandala of the five supreme souls (Paramesthis). Awarded for 500 Jain Seva points.',
    tradition: 'jain',
    milestoneType: 'score',
    milestoneValue: 500,
    imageUrl: '/relics/siddhachakra.png'
  },
  {
    id: 'jain-kalasha',
    name: 'Golden Jain Kalasha',
    description: 'The vessel of eternal purity and auspiciousness. Awarded for 1000 Jain Seva points.',
    tradition: 'jain',
    milestoneType: 'score',
    milestoneValue: 1000,
    imageUrl: '/relics/kalasha-gold.png'
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
