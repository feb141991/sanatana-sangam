/**
 * Canonical Sacred Festival Emblems
 *
 * Replaces cartoon system emojis with verified, source-authentic 3D sacred relics
 * and revered traditional iconography.
 */

export interface FestivalEmblemConfig {
  relicSrc: string;
  name: string;
  tradition: "hindu" | "sikh" | "jain" | "buddhist" | "all";
  sacredGlyph: string;
}

const RELIC_BY_SLUG: Record<string, FestivalEmblemConfig> = {
  // ── Lord Shiva ─────────────────────────────────────────────────────────────
  "maha-shivratri": {
    relicSrc: "/relics/trishula-gold.png",
    name: "Golden Trishula of Mahadev",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "maha-shivaratri": {
    relicSrc: "/relics/trishula-gold.png",
    name: "Golden Trishula of Mahadev",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "mahashivratri": {
    relicSrc: "/relics/trishula-gold.png",
    name: "Golden Trishula of Mahadev",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "pradosh-vrat": {
    relicSrc: "/relics/shiva-damaru.png",
    name: "Sacred Damaru of Shiva",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "masik-shivratri": {
    relicSrc: "/relics/shiva-damaru.png",
    name: "Sacred Damaru of Shiva",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },

  // ── Lord Ganesha ───────────────────────────────────────────────────────────
  "ganesh-chaturthi": {
    relicSrc: "/relics/ganesha-modak.png",
    name: "Divine Modak of Lord Ganesha",
    tradition: "hindu",
    sacredGlyph: "ॐ",
  },
  "vinayaka-chaturthi": {
    relicSrc: "/relics/ganesha-modak.png",
    name: "Divine Modak of Lord Ganesha",
    tradition: "hindu",
    sacredGlyph: "ॐ",
  },
  "sankashti-chaturthi": {
    relicSrc: "/relics/ganesha-modak.png",
    name: "Divine Modak of Lord Ganesha",
    tradition: "hindu",
    sacredGlyph: "ॐ",
  },

  // ── Shri Krishna ───────────────────────────────────────────────────────────
  "krishna-janmashtami": {
    relicSrc: "/relics/krishna-flute.png",
    name: "Murali Flute of Shri Krishna",
    tradition: "hindu",
    sacredGlyph: "🪷",
  },
  "janmashtami": {
    relicSrc: "/relics/krishna-flute.png",
    name: "Murali Flute of Shri Krishna",
    tradition: "hindu",
    sacredGlyph: "🪷",
  },
  "radhashtami": {
    relicSrc: "/relics/peacock-feather.png",
    name: "Sacred Mor Pankh of Shri Radha Krishna",
    tradition: "hindu",
    sacredGlyph: "🪷",
  },
  "gita-jayanti": {
    relicSrc: "/relics/prarthana-pothi.png",
    name: "Shrimad Bhagavad Gita Pothi",
    tradition: "hindu",
    sacredGlyph: "📖",
  },
  "govardhan-puja": {
    relicSrc: "/relics/brahma-lotus.png",
    name: "Sacred Annakut Offering",
    tradition: "hindu",
    sacredGlyph: "🪷",
  },

  // ── Shri Rama & Dussehra ───────────────────────────────────────────────────
  "ram-navami": {
    relicSrc: "/relics/rama-bow.png",
    name: "Kodanda Bow of Shri Rama",
    tradition: "hindu",
    sacredGlyph: "🏹",
  },
  "dussehra": {
    relicSrc: "/relics/rama-bow.png",
    name: "Kodanda Bow of Vijayadashami",
    tradition: "hindu",
    sacredGlyph: "🏹",
  },
  "vijayadashami": {
    relicSrc: "/relics/rama-bow.png",
    name: "Kodanda Bow of Vijayadashami",
    tradition: "hindu",
    sacredGlyph: "🏹",
  },
  "vivah-panchami": {
    relicSrc: "/relics/clay-kalash.png",
    name: "Sacred Vivah Kalasha of Sita Rama",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },

  // ── Shri Hanuman ───────────────────────────────────────────────────────────
  "hanuman-jayanti": {
    relicSrc: "/relics/hanuman-gada.png",
    name: "Sacred Gada of Shri Hanuman",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },

  // ── Diwali & Lights ────────────────────────────────────────────────────────
  "diwali": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Sacred Bronze Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "deepawali": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Sacred Bronze Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "chhoti-diwali": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Aarti Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "naraka-chaturdashi": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Sacred Dawn Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "dhanteras": {
    relicSrc: "/relics/ganga-kalash.png",
    name: "Amrita Kalasha of Dhanvantari",
    tradition: "hindu",
    sacredGlyph: "🪙",
  },
  "dev-deepawali": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Varanasi Ghat Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "bhai-dooj": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Sacred Aarti & Tilak Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "kartik-purnima": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Sacred Purnima Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },

  // ── Devi & Navratri ────────────────────────────────────────────────────────
  "navratri-begins": {
    relicSrc: "/relics/clay-kalash.png",
    name: "Ghatasthapana Sacred Kalasha",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "chaitra-navratri-begins": {
    relicSrc: "/relics/clay-kalash.png",
    name: "Chaitra Ghatasthapana Kalasha",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "gupt-navratri-ashadha-begins": {
    relicSrc: "/relics/durga-shield.png",
    name: "Devi Mahavidya Sacred Shield",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "gupt-navratri-magha-begins": {
    relicSrc: "/relics/durga-shield.png",
    name: "Devi Mahavidya Sacred Shield",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "durga-puja": {
    relicSrc: "/relics/durga-shield.png",
    name: "Astra Shield of Maa Durga",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "durga-ashtami": {
    relicSrc: "/relics/durga-shield.png",
    name: "Maha Ashtami Sacred Shield",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "maha-navami": {
    relicSrc: "/relics/camphor-flame.png",
    name: "Sacred Havan & Camphor Flame",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "chintpurni-mata-chaitra-navratri": {
    relicSrc: "/relics/clay-kalash.png",
    name: "Chintpurni Devi Shrine Kalasha",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },
  "chintpurni-mata-sharad-navratri": {
    relicSrc: "/relics/clay-kalash.png",
    name: "Chintpurni Devi Shrine Kalasha",
    tradition: "hindu",
    sacredGlyph: "🔱",
  },

  // ── Surya & Solar Observances ──────────────────────────────────────────────
  "makar-sankranti": {
    relicSrc: "/relics/ganga-kalash.png",
    name: "Surya Uttarayan Holy Kalasha",
    tradition: "hindu",
    sacredGlyph: "🌅",
  },
  "pongal": {
    relicSrc: "/relics/clay-kalash.png",
    name: "Surya Harvest Kalasha",
    tradition: "hindu",
    sacredGlyph: "🌾",
  },
  "chhath-nahay-khay": {
    relicSrc: "/relics/ganga-kalash.png",
    name: "Pavitra Ganga Snan Kalasha",
    tradition: "hindu",
    sacredGlyph: "🌊",
  },
  "chhath-kharna": {
    relicSrc: "/relics/camphor-flame.png",
    name: "Sacred Kharna Prasad Deepam",
    tradition: "hindu",
    sacredGlyph: "🌅",
  },
  "chhath-usha-arghya": {
    relicSrc: "/relics/copper-lota.png",
    name: "Surya Usha Arghya Patra",
    tradition: "hindu",
    sacredGlyph: "🌅",
  },

  // ── Sacred Ties & Seasons ──────────────────────────────────────────────────
  "raksha-bandhan": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Sacred Raksha Sutra & Aarti Thali",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "holi": {
    relicSrc: "/relics/camphor-flame.png",
    name: "Holika Dahan Sacred Fire",
    tradition: "hindu",
    sacredGlyph: "🔥",
  },
  "vasant-panchami": {
    relicSrc: "/relics/lotus-bloom.png",
    name: "Maa Saraswati Sacred Lotus",
    tradition: "hindu",
    sacredGlyph: "🪷",
  },
  "nag-panchami": {
    relicSrc: "/relics/ananta-shesha.png",
    name: "Divine Ananta Shesha",
    tradition: "hindu",
    sacredGlyph: "ॐ",
  },
  "anant-chaturdashi": {
    relicSrc: "/relics/ananta-shesha.png",
    name: "Ananta Shesha & Sacred Sutra",
    tradition: "hindu",
    sacredGlyph: "ॐ",
  },
  "guru-purnima": {
    relicSrc: "/relics/mala.png",
    name: "Guru Charana & Japa Mala",
    tradition: "all",
    sacredGlyph: "🪷",
  },
  "tulsi-vivah": {
    relicSrc: "/relics/tulsi-leaf.png",
    name: "Pavitra Tulsi Devi",
    tradition: "hindu",
    sacredGlyph: "🌿",
  },
  "karva-chauth": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Sacred Karva & Chanda Deepam",
    tradition: "hindu",
    sacredGlyph: "🪔",
  },
  "akshaya-tritiya": {
    relicSrc: "/relics/ganga-kalash.png",
    name: "Akshaya Udaka Kumbha",
    tradition: "hindu",
    sacredGlyph: "🪙",
  },
  "jagannath-puri-rath-yatra": {
    relicSrc: "/relics/chakra.png",
    name: "Sudarshana Chakra of Jagannath",
    tradition: "hindu",
    sacredGlyph: "☸",
  },

  // ── Ekadashis ──────────────────────────────────────────────────────────────
  "nirjala-ekadashi": {
    relicSrc: "/relics/tulsi-leaf.png",
    name: "Nirjala Vrata Tulsi Dal",
    tradition: "hindu",
    sacredGlyph: "🌿",
  },
  "vaikunta-ekadashi": {
    relicSrc: "/relics/shankha-conch.png",
    name: "Panchajanya Shankha of Vaikuntha",
    tradition: "hindu",
    sacredGlyph: "🐚",
  },
  "devshayani-ekadashi": {
    relicSrc: "/relics/ananta-shesha.png",
    name: "Sheshashayi Vishnu Dhyana",
    tradition: "hindu",
    sacredGlyph: "ॐ",
  },
  "devutthana-ekadashi": {
    relicSrc: "/relics/mindful-bell.png",
    name: "Prabodhini Sacred Bell",
    tradition: "hindu",
    sacredGlyph: "🔔",
  },

  // ── Sikh Dharma Gurpurabs & Parvs ──────────────────────────────────────────
  "guru-nanak-gurpurab": {
    relicSrc: "/relics/khanda-gold.png",
    name: "Golden Khanda Sahib",
    tradition: "sikh",
    sacredGlyph: "ੴ",
  },
  "guru-gobind-singh-gurpurab": {
    relicSrc: "/relics/nishan-sahib.png",
    name: "Nishan Sahib of Guru Gobind Singh Ji",
    tradition: "sikh",
    sacredGlyph: "☬",
  },
  "baisakhi": {
    relicSrc: "/relics/sacred-kirpan.png",
    name: "Sacred Kirpan & Khalsa Sirjana",
    tradition: "sikh",
    sacredGlyph: "☬",
  },
  "bandhi-chhor-divas": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Harmandir Sahib Deepmala",
    tradition: "sikh",
    sacredGlyph: "ੴ",
  },
  "holla-mohalla": {
    relicSrc: "/relics/deg-teg.png",
    name: "Deg Teg Fateh Emblem",
    tradition: "sikh",
    sacredGlyph: "☬",
  },
  "lohri": {
    relicSrc: "/relics/camphor-flame.png",
    name: "Sacred Bonfire Flame",
    tradition: "sikh",
    sacredGlyph: "🔥",
  },
  "guru-arjan-dev-martyrdom": {
    relicSrc: "/relics/gurbani-pothi.png",
    name: "Adi Granth Sahib Ji Pothi",
    tradition: "sikh",
    sacredGlyph: "ੴ",
  },
  "guru-tegh-bahadur-martyrdom": {
    relicSrc: "/relics/khanda-gold.png",
    name: "Khanda Sahib of Dharam Rakshak",
    tradition: "sikh",
    sacredGlyph: "☬",
  },
  "sahibzade-shaheedi-diwas": {
    relicSrc: "/relics/khanda-gold.png",
    name: "Chaar Sahibzade Shaheedi Emblem",
    tradition: "sikh",
    sacredGlyph: "☬",
  },
  "guru-ravidas-jayanti": {
    relicSrc: "/relics/gurbani-pothi.png",
    name: "Bhagat Ravidas Ji Gurbani Pothi",
    tradition: "sikh",
    sacredGlyph: "ੴ",
  },

  // ── Buddhist Dharma ────────────────────────────────────────────────────────
  "vesak-buddha-purnima": {
    relicSrc: "/relics/bodhi-leaf.png",
    name: "Sacred Bodhi Leaf of Awakening",
    tradition: "buddhist",
    sacredGlyph: "☸",
  },
  "asalha-puja": {
    relicSrc: "/relics/dharma-wheel.png",
    name: "Dharmachakka Eightfold Wheel",
    tradition: "buddhist",
    sacredGlyph: "☸",
  },
  "magha-puja": {
    relicSrc: "/relics/lotus-bloom.png",
    name: "Sacred Lotus of the Sangha",
    tradition: "buddhist",
    sacredGlyph: "🪷",
  },
  "bodhi-day": {
    relicSrc: "/relics/bodhi-leaf.png",
    name: "Bodhi Tree of Enlightenment",
    tradition: "buddhist",
    sacredGlyph: "☸",
  },
  "parinirvana-day": {
    relicSrc: "/relics/dharma-wheel.png",
    name: "Maha Parinirvana Dharmachakra",
    tradition: "buddhist",
    sacredGlyph: "☸",
  },
  "kathina": {
    relicSrc: "/relics/alms-bowl.png",
    name: "Sangha Robe & Alms Bowl",
    tradition: "buddhist",
    sacredGlyph: "☸",
  },

  // ── Jain Dharma ────────────────────────────────────────────────────────────
  "mahavir-jayanti": {
    relicSrc: "/relics/ahimsa-hand.png",
    name: "Sacred Ahimsa Wheel & Hand",
    tradition: "jain",
    sacredGlyph: "卐",
  },
  "paryushana-parva-begins": {
    relicSrc: "/relics/siddhachakra-wheel.png",
    name: "Siddhachakra Navapad Wheel",
    tradition: "jain",
    sacredGlyph: "卐",
  },
  "samvatsari-paryushana-ends": {
    relicSrc: "/relics/ahimsa-hand.png",
    name: "Micchami Dukkadam Universal Forgiveness",
    tradition: "jain",
    sacredGlyph: "🙏",
  },
  "das-lakshana-dharma-begins": {
    relicSrc: "/relics/jain-kalasha.png",
    name: "Mangala Kalasha of Jain Dharma",
    tradition: "jain",
    sacredGlyph: "卐",
  },
  "jain-diwali-nirvana-ladnun": {
    relicSrc: "/relics/diya-bronze.png",
    name: "Lord Mahavira Nirvana Deepotsav",
    tradition: "jain",
    sacredGlyph: "🪔",
  },
  "jain-new-year-pratipada": {
    relicSrc: "/relics/siddhashila-moon.png",
    name: "Siddhashila Sacred Crescent",
    tradition: "jain",
    sacredGlyph: "卐",
  },
  "kartik-purnima-jain": {
    relicSrc: "/relics/siddhashila-moon.png",
    name: "Shatrunjaya Teerth Yatra Emblem",
    tradition: "jain",
    sacredGlyph: "卐",
  },
  "akshaya-tritiya-jain": {
    relicSrc: "/relics/golden-fish.png",
    name: "Akshaya Tritiya Ikshu Rasa",
    tradition: "jain",
    sacredGlyph: "卐",
  },
};

/**
 * Returns a high-resolution 3D sacred relic emblem config for any festival slug.
 * Automatically falls back to tradition-accurate sacred relics if slug is unmapped.
 */
export function getFestivalEmblem(slug: string, tradition?: string): FestivalEmblemConfig {
  const normalized = (slug || "").toLowerCase().trim();

  if (RELIC_BY_SLUG[normalized]) {
    return RELIC_BY_SLUG[normalized];
  }

  // Check prefix or partial match for Ekadashi
  if (normalized.includes("shiv")) return { relicSrc: "/relics/trishula-gold.png", name: "Golden Trishula of Mahadev", tradition: "hindu", sacredGlyph: "🔱" };
  if (normalized.includes("ekadashi")) {
    return {
      relicSrc: "/relics/tulsi-leaf.png",
      name: "Pavitra Tulsi & Shankha",
      tradition: "hindu",
      sacredGlyph: "🌿",
    };
  }

  // Check prefix or partial match for Navratri
  if (normalized.includes("navratri")) {
    return {
      relicSrc: "/relics/clay-kalash.png",
      name: "Ghatasthapana Sacred Kalasha",
      tradition: "hindu",
      sacredGlyph: "🔱",
    };
  }

  // Check prefix or partial match for Paryushana
  if (normalized.includes("paryushana")) {
    return {
      relicSrc: "/relics/siddhachakra-wheel.png",
      name: "Siddhachakra Navapad Wheel",
      tradition: "jain",
      sacredGlyph: "卐",
    };
  }

  // Check prefix for Gurpurab
  if (normalized.includes("gurpurab") || normalized.includes("guru-")) {
    return {
      relicSrc: "/relics/khanda-gold.png",
      name: "Golden Khanda Sahib",
      tradition: "sikh",
      sacredGlyph: "ੴ",
    };
  }

  // Tradition-based fallback
  const trad = (tradition || "").toLowerCase();
  switch (trad) {
    case "sikh":
      return {
        relicSrc: "/relics/khanda-gold.png",
        name: "Golden Khanda Sahib",
        tradition: "sikh",
        sacredGlyph: "ੴ",
      };
    case "buddhist":
      return {
        relicSrc: "/relics/dharma-wheel.png",
        name: "Dharmachakka Eightfold Wheel",
        tradition: "buddhist",
        sacredGlyph: "☸",
      };
    case "jain":
      return {
        relicSrc: "/relics/ahimsa-hand.png",
        name: "Sacred Ahimsa Wheel",
        tradition: "jain",
        sacredGlyph: "卐",
      };
    default:
      return {
        relicSrc: "/relics/diya-bronze.png",
        name: "Sacred Bronze Deepam",
        tradition: "hindu",
        sacredGlyph: "🪔",
      };
  }
}
