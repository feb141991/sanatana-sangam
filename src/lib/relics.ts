export interface Relic {
  id: string;
  name: string;
  description: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'universal';
  milestoneType: 'streak' | 'score';
  milestoneValue: number;
  imageUrl: string;
  lore: string;
  effect: string; // one sentence, plain English, what equipping this relic visibly changes
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
    imageUrl: '/relics/diya-bronze.png',
    lore: 'The Bronze Diya radiates the warm, steady light of pure intention. It stands as a universal symbol of awakening, guiding the seeker out of inner darkness.',
    effect: 'Warms your home accent to amber gold.'
  },
  {
    id: 'clay-kalash',
    name: 'Clay Kalash',
    description: 'A vessel of reception representing the empty mind, ready for wisdom. Awarded for a 5-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/clay-kalash.png',
    lore: 'Crafted from the earth, the Clay Kalash represents the absolute receptivity of a quiet mind. It reminds us to empty ourselves of ego so that divine wisdom may flow in.',
    effect: 'Shifts your home accent to warm clay terracotta.'
  },
  {
    id: 'incense-sandalwood',
    name: 'Sandalwood Incense',
    description: 'The fragrance of tranquil presence, purifying your daily workspace. Awarded for a 7-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 7,
    imageUrl: '/relics/incense-sandalwood.png',
    lore: 'Incense purifies both outer space and inner awareness. In Indic traditions, its soothing aroma calms the breath and anchors the mind in the present moment.',
    effect: 'Shifts your home accent to soft sandalwood gold.'
  },
  {
    id: 'camphor-flame',
    name: 'Camphor Flame',
    description: 'A blazing light of awareness that leaves no residue of ego. Awarded for a 10-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 10,
    imageUrl: '/relics/camphor-flame.png',
    lore: 'The Camphor Flame burns brightly, dissolving completely without leaving a trace of residue. It represents the ultimate offering of the self, where the ego is entirely consumed in the fire of awareness.',
    effect: 'Shifts your home accent to bright camphor yellow.'
  },
  {
    id: 'mindful-bell',
    name: 'Bell of Ghanta',
    description: 'Dispeller of heavy energies and caller of pure focus. Awarded for a 14-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 14,
    imageUrl: '/relics/mindful-bell.png',
    lore: 'The ringing of the Ghanta cuts through mental clutter, invoking pure focus. Its sacred vibration dispels heavy energies and alerts the soul to the arrival of the divine.',
    effect: 'Shifts your home accent to shining brass bronze.'
  },
  {
    id: 'copper-lota',
    name: 'Copper Lota',
    description: 'A pure vessel of copper representing physical purification and elemental balance. Awarded for a 30-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 30,
    imageUrl: '/relics/copper-lota.png',
    lore: 'The Copper Lota holds pure water, balancing the body\'s vital elements. In sacred rituals, copper represents elemental purification and the alignment of physical and spiritual channels.',
    effect: 'Shifts your home accent to polished copper orange.'
  },
  {
    id: 'asana-kusha',
    name: 'Kusha Grass Asana',
    description: 'The ancient meditation seat of sages, insulating the seeker from distracting earthly currents. Awarded for a 5-day sadhana streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/asana-kusha.png',
    lore: 'The Kusha Grass Asana is the traditional seat of ancient sages. It grounds the meditator, insulating them from earthly distractions and stabilizing their connection to higher realms.',
    effect: 'Shifts your home accent to natural grass gold.'
  },
  {
    id: 'sacred-mala',
    name: 'Rudraksha Mala',
    description: 'The beads of constancy. Awarded for 108 total Seva points.',
    tradition: 'universal',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/mala.png',
    lore: 'The Rudraksha Mala is the constant companion of the practitioner\'s breath. Each of its 108 beads binds the mind to steady remembrance and the accumulation of divine grace.',
    effect: 'Sets your japa mala and avatar frame to deep rudraksha brown with a warm accent.'
  },
  {
    id: 'shankha-conch',
    name: 'Sacred Shankha',
    description: 'The primal sound of creation, dispelling negative vibrations. Awarded for 250 total Seva points.',
    tradition: 'universal',
    milestoneType: 'score',
    milestoneValue: 250,
    imageUrl: '/relics/shankha-conch.png',
    lore: 'The Shankha carries the primordial sound of creation. Worn or kept close, its sacred resonance purifies the subtle body and protects the seeker\'s spiritual boundaries.',
    effect: 'Adds a pearlescent white border to your avatar and shifts your home accent to soft cream.'
  },
  {
    id: 'prarthana-pothi',
    name: 'Devotional Pothi',
    description: 'A compilation of early prayers and daily verses. Awarded for 500 total Seva points.',
    tradition: 'universal',
    milestoneType: 'score',
    milestoneValue: 500,
    imageUrl: '/relics/prarthana-pothi.png',
    lore: 'The Devotional Pothi holds the words of the wise and the chants of old. It is a light for the dark hours, reminding the practitioner of the eternal truths that guide the path.',
    effect: 'Shifts your home accent to sacred manuscript yellow.'
  },
  {
    id: 'the-sage-halo',
    name: 'Aura of the Sage',
    description: 'A golden halo of light. Awarded for a 365-day unbroken streak.',
    tradition: 'universal',
    milestoneType: 'streak',
    milestoneValue: 365,
    imageUrl: '/relics/halo.png',
    lore: 'The Aura of the Sage is the shining light of uninterrupted sadhana. It represents the ultimate state of spiritual illumination, where the seeker\'s field radiates pure peace.',
    effect: 'Turns your japa mala pure gold and glows your home accent bright yellow.'
  },
  
  // ── HINDU RELICS ──
  {
    id: 'ganesha-modak',
    name: 'Modak of Wisdom',
    description: 'Ganesha\'s sweet reward of single-minded focus and removal of obstacles. Awarded for a 5-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/ganesha-modak.png',
    lore: 'The Modak is Ganesha\'s sweet offering of supreme wisdom and fulfillment. It symbolizes the sweetness of a focused spiritual life and the joy of overcoming all inner obstacles.',
    effect: 'Shifts your home accent to saffron orange.'
  },
  {
    id: 'vibhuti-ash',
    name: 'Sacred Vibhuti',
    description: 'Pure ash of Shiva\'s dhuni, reminding us of our ultimate spiritual form. Awarded for a 9-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 9,
    imageUrl: '/relics/vibhuti-ash.png',
    lore: 'The Sacred Vibhuti is the holy ash of Shiva\'s eternal dhuni. Applied with devotion, it reminds the seeker of the impermanence of the body and our final union with the formless divine.',
    effect: 'Shifts your home accent to sacred ash grey-blue.'
  },
  {
    id: 'trishula-gold',
    name: 'Golden Trishula',
    description: 'The trident of Shiva. Awarded for a 21-day Hindu sadhana streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/trishula-gold.png',
    lore: 'The Trishula represents the threefold powers of willpower, knowledge, and action. Shiva\'s trident cuts through the illusions of past, present, and future to grant liberation.',
    effect: 'Adds a golden trident border to your avatar and shifts your home accent to bright gold.'
  },
  {
    id: 'krishna-flute',
    name: 'Krishna\'s Flute',
    description: 'The hollow reed of pure devotion, drawing the soul to absolute divine love. Awarded for a 30-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 30,
    imageUrl: '/relics/krishna-flute.png',
    lore: 'Krishna\'s Flute represents the hollowed self, completely free of ego and expectation. When we empty ourselves, the Divine can play the sweet melody of unconditional love through us.',
    effect: 'Sets your japa mala to deep Yamuna blue and your home accent to sky blue.'
  },
  {
    id: 'rama-bow',
    name: 'Bow of Sri Rama',
    description: 'Kodanda, representing unswerving righteousness (Dharma) and absolute precision. Awarded for a 50-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/rama-bow.png',
    lore: 'The Bow of Sri Rama represents unswerving righteousness and complete mental focus. It is the symbol of Dharma, reminding the seeker to aim for absolute precision in truth.',
    effect: 'Shifts your home accent to royal deep red.'
  },
  {
    id: 'peacock-feather',
    name: 'Peacock Feather',
    description: 'The crown jewel of Krishna, representing beauty, purity, and play. Awarded for a 75-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 75,
    imageUrl: '/relics/peacock-feather.png',
    lore: 'The Peacock Feather is the crown jewel of divine beauty and playfulness. It represents the joyful lightness of a soul that has dedicated all its colorful qualities to Krishna.',
    effect: 'Shifts your home accent to vibrant peacock teal.'
  },
  {
    id: 'durga-shield',
    name: 'Shield of Durga',
    description: 'Invincible protective energy shield of the Divine Mother. Awarded for a 108-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/durga-shield.png',
    lore: 'The Shield of Durga represents the invincible protective energy of the Divine Mother. It safeguards the seeker against spiritual obstacles and inner vulnerabilities.',
    effect: 'Gives your avatar a saffron glow and shifts your home accent to fiery orange.'
  },
  {
    id: 'ananta-shesha',
    name: 'Ananta Shesha Canopy',
    description: 'The infinite cosmic serpent providing shelter to your deep meditation. Awarded for a 200-day Hindu streak.',
    tradition: 'hindu',
    milestoneType: 'streak',
    milestoneValue: 200,
    imageUrl: '/relics/ananta-shesha.png',
    lore: 'The Ananta Shesha Canopy represents the infinite cosmic serpent providing shelter to Vishnu. It offers absolute protection and stability to the meditator\'s quiet space.',
    effect: 'Shifts your home accent to cosmic purple.'
  },
  {
    id: 'tulsi-leaf',
    name: 'Sacred Tulsi Leaf',
    description: 'The divine plant of Vishnu, embodying absolute healing and selfless service. Awarded for 108 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/tulsi-leaf.png',
    lore: 'The Tulsi Leaf holds the living energy of devotion and absolute healing. Sacred to Vishnu, it is the highest offering of selfless love and purification.',
    effect: 'Sets your japa mala to basil green and shifts your home accent to vibrant green.'
  },
  {
    id: 'shiva-damaru',
    name: 'Damaru of Shiva',
    description: 'The cosmic drum beating the steady rhythm of transformation. Awarded for 300 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 300,
    imageUrl: '/relics/shiva-damaru.png',
    lore: 'The Damaru of Shiva beats the primal rhythm from which the cosmos emerges. Its steady sound aligns the practitioner\'s pulse with the cosmic flow of creation and dissolution.',
    effect: 'Shifts your home accent to terracotta red.'
  },
  {
    id: 'nandi-devotion',
    name: 'Steadfast Nandi',
    description: 'The calm devotion of Nandi, constantly focused on the Divine. Awarded for 450 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 450,
    imageUrl: '/relics/nandi-devotion.png',
    lore: 'Nandi represents the silent, steady power of waiting and complete dedication. Constantly facing the Shiva Lingam, he is the emblem of absolute focus and deep devotion.',
    effect: 'Shifts your home accent to devout white-cream.'
  },
  {
    id: 'brahma-lotus',
    name: 'Lotus of Brahma',
    description: 'The pure flower of creation and self-expansion. Awarded for 600 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 600,
    imageUrl: '/relics/brahma-lotus.png',
    lore: 'The Lotus of Brahma represents the immaculate blossom of cosmic creation. It calls the practitioner to unfold the pure lotus of the heart and expand their spiritual vision.',
    effect: 'Sets your japa mala to lotus pink and shifts your home accent to soft pink.'
  },
  {
    id: 'hanuman-gada',
    name: 'Gada of Hanuman',
    description: 'The golden mace of strength, service, and absolute humility. Awarded for 800 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 800,
    imageUrl: '/relics/hanuman-gada.png',
    lore: 'Hanuman\'s Gada represents immense spiritual strength united with absolute humility. It is a reminder that true power lies in the selfless service of the Divine.',
    effect: 'Shifts your home accent to radiant golden orange.'
  },
  {
    id: 'sudarshana-chakra',
    name: 'Sudarshana Chakra',
    description: 'The wheel of cosmic order. Awarded for 1000 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 1000,
    imageUrl: '/relics/chakra.png',
    lore: 'The Sudarshana Chakra represents the revolving wheel of cosmic order and ultimate protection. It cuts through the thickest dark of ignorance and guards the path of the righteous.',
    effect: 'Gives your avatar a golden border and shifts your home accent to bright gold.'
  },
  {
    id: 'ganga-kalash',
    name: 'Ganga Kalash',
    description: 'A pure golden urn filled with the holy waters of the Ganges, representing flow and purification. Awarded for 1500 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 1500,
    imageUrl: '/relics/ganga-kalash.png',
    lore: 'The Ganga Kalash contains the holy waters of the Ganges, descending from Shiva\'s locks. It embodies absolute spiritual purification and the continuous flow of divine grace.',
    effect: 'Shifts your home accent to sparkling river gold.'
  },
  {
    id: 'rishi-kamandalu',
    name: 'Rishi Kamandalu',
    description: 'The ascetic\'s water pot, representing renunciation of luxuries and absolute contentment. Awarded for 2500 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 2500,
    imageUrl: '/relics/rishi-kamandalu.png',
    lore: 'The Rishi Kamandalu is the simple vessel of water carried by wandering ascetics. It represents perfect self-reliance, renunciation of unnecessary luxuries, and ultimate contentment.',
    effect: 'Shifts your home accent to ascetic ochre.'
  },
  {
    id: 'chintamani-gem',
    name: 'Chintamani Gem',
    description: 'The mythical wish-fulfilling jewel, symbolizing the supreme peace of self-knowledge. Awarded for 5000 Hindu Seva points.',
    tradition: 'hindu',
    milestoneType: 'score',
    milestoneValue: 5000,
    imageUrl: '/relics/chintamani-gem.png',
    lore: 'The mythical Chintamani Gem represents the wish-fulfilling jewel of self-realization. It holds the supreme light of consciousness, satisfying all spiritual hunger forever.',
    effect: 'Gives your avatar a vivid emerald glow and shifts your home accent to jade.'
  },
  
  // ── SIKH RELICS ──
  {
    id: 'steel-kara',
    name: 'Steel Kara',
    description: 'The iron bracelet representing infinity, eternity, and restraint in actions. Awarded for a 5-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/steel-kara.png',
    lore: 'The Steel Kara is the unbroken circle of Waheguru\'s presence, worn as a constant reminder that the Sikh never stands alone. It binds the wearer to righteous deeds and divine restraint.',
    effect: 'Shifts your home accent to steel grey-blue.'
  },
  {
    id: 'sacred-kirpan',
    name: 'Sacred Kirpan',
    description: 'The sword of mercy and defense of the weak. Awarded for an 11-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 11,
    imageUrl: '/relics/sacred-kirpan.png',
    lore: 'The Kirpan is the sword of active mercy, representing the duty to protect the weak and uphold justice. It calls the seeker to stand firmly against inner and outer oppression.',
    effect: 'Shifts your home accent to bright steel blue.'
  },
  {
    id: 'khanda-gold',
    name: 'Golden Khanda',
    description: 'The emblem of Khalsa. Awarded for a 21-day Sikh sadhana streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/khanda-gold.png',
    lore: 'The Khanda represents the ultimate balance of temporal and spiritual power. It is the emblem of absolute sovereignty, reminding the soul of its dual duty to truth and justice.',
    effect: 'Shifts your home accent and avatar frame to steel blue.'
  },
  {
    id: 'sikh-chaur',
    name: 'Chaur Sahib',
    description: 'The fly-whisk of royal reverence waved over the Guru Granth Sahib, representing humility. Awarded for a 50-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/sikh-chaur.png',
    lore: 'The Chaur Sahib represents royal respect and complete surrender to the eternal word. Waved in service, it reminds the practitioner of the beauty of absolute humility.',
    effect: 'Shifts your home accent to soft teal.'
  },
  {
    id: 'kartarpur-nishan',
    name: 'Nishan of Kartarpur',
    description: 'Awarded for exceptional dedication to selfless service and Kirat Karo (honest labor). Awarded for a 108-day Sikh streak.',
    tradition: 'sikh',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/kartarpur-nishan.png',
    lore: 'The Nishan of Kartarpur represents the historical home of Guru Nanak\'s community. It stands as a symbol of honest labor, shared meals, and unwavering devotion to the One.',
    effect: 'Shifts your home accent to royal blue.'
  },
  {
    id: 'wooden-kangha',
    name: 'Wooden Kangha',
    description: 'The clean wooden comb, representing order, mental discipline, and cleanliness. Awarded for 108 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/wooden-kangha.png',
    lore: 'The wooden Kangha is kept in the hair to maintain absolute order and cleanliness. It represents the combing away of untruths and the maintenance of a disciplined, clean mind.',
    effect: 'Shifts your home accent to warm brown-teal.'
  },
  {
    id: 'nishan-sahib',
    name: 'Golden Nishan Sahib',
    description: 'The high banner of truth, sovereignty, and shelter. Awarded for 350 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 350,
    imageUrl: '/relics/nishan-sahib.png',
    lore: 'The Nishan Sahib is the high banner of Khalsa hope, sovereignty, and shelter. Its presence reminds the practitioner that they are part of a community that shields all who seek refuge.',
    effect: 'Shifts your home accent to deep navy blue.'
  },
  {
    id: 'deg-teg',
    name: 'Deg and Teg',
    description: 'The cauldron (food for all) and sword (protection for all), representing Khalsa hospitality. Awarded for 600 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 600,
    imageUrl: '/relics/deg-teg.png',
    lore: 'The Deg and Teg represent the sacred integration of the cooking pot and the defensive sword. It signifies the dual command to feed the hungry and protect the defenseless.',
    effect: 'Adds a green-glow border to your avatar and shifts your home accent to steel teal.'
  },
  {
    id: 'gurbani-pothi',
    name: 'Pothi of Gurbani',
    description: 'A beautifully preserved manuscript of the Guru\'s hymns. Awarded for 1000 Sikh Seva points.',
    tradition: 'sikh',
    milestoneType: 'score',
    milestoneValue: 1000,
    imageUrl: '/relics/gurbani-pothi.png',
    lore: 'The Gurbani Pothi preserves the holy hymns and daily verses of the Gurus. It serves as the ultimate guiding light, bringing steady wisdom to the seeker\'s daily practice.',
    effect: 'Shifts your home accent to indigo blue.'
  },
  
  // ── BUDDHIST RELICS ──
  {
    id: 'lotus-bloom',
    name: 'Lotus Bloom',
    description: 'Rising out of the mud of samsara to blossom in the sunlight of awakening. Awarded for a 5-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/lotus-bloom.png',
    lore: 'The Lotus Bloom rising out of the mud represents the heart unfolding in pure awakening. It is a reminder that we can transcend the confusion of samsara and achieve perfect clarity.',
    effect: 'Shifts your home accent to delicate lotus pink.'
  },
  {
    id: 'alms-bowl',
    name: 'Alms Bowl (Patra)',
    description: 'The monk\'s bowl representing physical detachment and absolute receptivity. Awarded for a 12-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 12,
    imageUrl: '/relics/alms-bowl.png',
    lore: 'The Patra represents the monastic vow of absolute receptivity and letting go of possessions. It teaches the seeker to receive each moment of life with a grateful, unattached heart.',
    effect: 'Shifts your home accent to monks-robe ochre.'
  },
  {
    id: 'dharma-wheel-gold',
    name: 'Golden Dharmachakra',
    description: 'The wheel of Dharma. Awarded for a 21-day Buddhist sadhana streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 21,
    imageUrl: '/relics/dharma-wheel.png',
    lore: 'The Dharmachakra represents the turning of the Buddha\'s wheel of noble truths. Its eight spokes guide the seeker along the path of right understanding, livelihood, and meditation.',
    effect: 'Gives your avatar an orange border and shifts your home accent to terracotta.'
  },
  {
    id: 'treasure-vase',
    name: 'Treasure Vase',
    description: 'The vessel containing infinite spiritual treasures of health and wisdom. Awarded for a 50-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 50,
    imageUrl: '/relics/treasure-vase.png',
    lore: 'The Treasure Vase represents the infinite wealth of spiritual wisdom and compassion. It never empties, providing continuous blessings of peace and health to the practitioner.',
    effect: 'Shifts your home accent to rich golden amber.'
  },
  {
    id: 'golden-fish',
    name: 'Pair of Golden Fish',
    description: 'Representing fearless movement and liberation through the deep waters of samsara. Awarded for a 108-day Buddhist streak.',
    tradition: 'buddhist',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/golden-fish.png',
    lore: 'The Pair of Golden Fish represents fearless movement through the vast ocean of existence. They remind us to glide gracefully through the tides of life without fear of drowning.',
    effect: 'Shifts your home accent to golden yellow-orange.'
  },
  {
    id: 'bodhi-leaf',
    name: 'Bodhi Leaf',
    description: 'A leaf of the sacred fig tree under which Gautama attained enlightenment. Awarded for 108 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/bodhi-leaf.png',
    lore: 'The Bodhi Leaf represents the shade of the sacred fig tree under which Gautama attained enlightenment. It embodies the supreme moment of awakening and absolute mental peace.',
    effect: 'Sets your japa mala to earthy brown and shifts your home accent to leaf green.'
  },
  {
    id: 'prayer-wheel',
    name: 'Prayer Wheel',
    description: 'Embodying the continuous turning of the wheel of compassion. Awarded for 400 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 400,
    imageUrl: '/relics/prayer-wheel.png',
    lore: 'The Prayer Wheel contains thousands of written mantras of compassion. With each turn, it radiates peaceful intentions throughout the universe, purifying the practitioner\'s karma.',
    effect: 'Shifts your home accent to copper-bronze amber.'
  },
  {
    id: 'vajra-scepter',
    name: 'Vajra Scepter',
    description: 'The thunderbolt of diamond clarity that shatters delusion and illusion. Awarded for 750 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 750,
    imageUrl: '/relics/vajra-scepter.png',
    lore: 'The Vajra represents the thunderbolt of diamond-like clarity that shatters all spiritual obstacles. It cuts through the illusions of self, granting unshakeable truth.',
    effect: 'Gives your avatar a sky blue frame and shifts your home accent to royal blue.'
  },
  {
    id: 'parasol-royalty',
    name: 'Parasol of Royalty',
    description: 'Providing protective shelter from the burning heat of desire and anger. Awarded for 1200 Buddhist Seva points.',
    tradition: 'buddhist',
    milestoneType: 'score',
    milestoneValue: 1200,
    imageUrl: '/relics/parasol-royalty.png',
    lore: 'The Parasol represents protective shelter from the scorching heat of worldly desires and delusions. It guards the practitioner\'s clean awareness and spiritual integrity.',
    effect: 'Shifts your home accent to royal golden-yellow.'
  },
  
  // ── JAIN RELICS ──
  {
    id: 'jain-swastika',
    name: 'Jinendra Swastika',
    description: 'Representing the four states of cycle existence (Gatis) and the absolute path to liberation. Awarded for a 5-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 5,
    imageUrl: '/relics/jain-swastika.png',
    lore: 'The Jinendra Swastika represents the four realms of rebirth and the path of the three jewels. It is a map for the soul, guiding it out of the cycles of existence to liberation.',
    effect: 'Shifts your home accent to white-gold.'
  },
  {
    id: 'peacock-brush',
    name: 'Peacock Brush',
    description: 'Rajoharan, used by monks to gently clean paths of microscopic life, embodying absolute Ahimsa. Awarded for a 15-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 15,
    imageUrl: '/relics/peacock-brush.png',
    lore: 'The Rajoharan peacock brush is used by Jain monks to gently sweep away microscopic life, embodying absolute Ahimsa. It reminds the practitioner to move through the world with deep care.',
    effect: 'Shifts your home accent to soft sage green.'
  },
  {
    id: 'siddhashila-moon',
    name: 'Crescent of Siddhashila',
    description: 'Representing the absolute peak of the universe where liberated souls rest in pure bliss. Awarded for a 30-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 30,
    imageUrl: '/relics/siddhashila-moon.png',
    lore: 'The Crescent of Siddhashila represents the supreme peak of the universe where liberated souls rest in pure bliss. It is the ultimate goal of the seeker, signifying infinite knowledge.',
    effect: 'Shifts your home accent to cool silver-white.'
  },
  {
    id: 'ahimsa-hand',
    name: 'Ahimsakar Hand',
    description: 'The palm with the wheel of Dharma, representing absolute non-violence and vigilance. Awarded for a 108-day Jain streak.',
    tradition: 'jain',
    milestoneType: 'streak',
    milestoneValue: 108,
    imageUrl: '/relics/ahimsa-hand.png',
    lore: 'The Ahimsakar Hand holds the wheel of Dharma with \'Ahimsa\' in its center. It is the absolute shield of non-violence, calling the seeker to absolute vigilance in peace.',
    effect: 'Shifts your home accent to soft cream-gold.'
  },
  {
    id: 'three-jewels',
    name: 'Three Jewels (Triratna)',
    description: 'Samyak Darshana (Faith), Samyak Jnana (Knowledge), and Samyak Charitra (Conduct). Awarded for 108 Jain Seva points.',
    tradition: 'jain',
    milestoneType: 'score',
    milestoneValue: 108,
    imageUrl: '/relics/three-jewels.png',
    lore: 'The Triratna represents the three pillars of Right Faith, Right Knowledge, and Right Conduct. Together, they form the secure foundation for the soul\'s journey to liberation.',
    effect: 'Adds a sage green border to your avatar and shifts your home accent to emerald green.'
  },
  {
    id: 'siddhachakra-wheel',
    name: 'Siddhachakra Wheel',
    description: 'The sacred mandala of the five supreme souls (Paramesthis). Awarded for 500 Jain Seva points.',
    tradition: 'jain',
    milestoneType: 'score',
    milestoneValue: 500,
    imageUrl: '/relics/siddhachakra-wheel.png',
    lore: 'The Siddhachakra Wheel is the sacred mandala of the five supreme beings. Meditating upon it brings absolute balance and purifies the subtle channels of the mind.',
    effect: 'Adds a silver-blue border to your avatar and shifts your home accent to cool silver.'
  },
  {
    id: 'jain-kalasha',
    name: 'Golden Jain Kalasha',
    description: 'The vessel of eternal purity and auspiciousness. Awarded for 1000 Jain Seva points.',
    tradition: 'jain',
    milestoneType: 'score',
    milestoneValue: 1000,
    imageUrl: '/relics/jain-kalasha.png',
    lore: 'The Golden Jain Kalasha represents eternal auspiciousness, purity, and the fullness of wisdom. It is a symbol of welcome, inviting auspicious spiritual currents into the heart.',
    effect: 'Shifts your home accent to polished white-gold.'
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
