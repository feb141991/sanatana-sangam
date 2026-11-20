// ============================================================================
// Shoonaya Related Wisdom & Contextual Linking Service (Pramana Knowledge Mesh)
// Connects Vrats, Kathas, Stotras, Panchang, and Journal guides using audited,
// verified routes and contextual Dharma Mitra AI discovery prompts.
// ============================================================================

import { VRAT_DATABASE, lookupVratData } from '@/lib/vrat-data';
import { getKathaById, type Katha } from '@/lib/katha-library';
import { STOTRAMS } from '@/lib/stotrams';
import { getAllJournalEssays } from '@/config/journal';

export interface RelatedWisdomLink {
  title: string;
  subtitle?: string;
  category: 'katha' | 'vrat' | 'stotram' | 'journal' | 'panchang' | 'tradition';
  description: string;
  url: string;
  badge?: string;
}

export interface RelatedWisdomPayload {
  heading: string;
  description: string;
  links: RelatedWisdomLink[];
  aiPrompts: string[];
}

/**
 * Returns verified contextual wisdom links and AI prompts for a Vrat observance.
 */
export function getRelatedWisdomForVrat(slug: string): RelatedWisdomPayload {
  const normalizedSlug = slug.toLowerCase().trim();
  const vrat = lookupVratData(normalizedSlug);

  const links: RelatedWisdomLink[] = [];
  const aiPrompts: string[] = [];

  switch (normalizedSlug) {
    case 'ekadashi': {
      links.push(
        {
          title: 'Mohini Ekadashi Katha',
          subtitle: 'Sacred Vrat Story',
          category: 'katha',
          description: 'The sacred narrative of Mohini Ekadashi, dissolving delusion and purifying the mind.',
          url: '/bhakti/katha/katha-ekadashi-vaisakha-shukla',
          badge: 'Sacred Katha',
        },
        {
          title: 'Vishnu Sahasranama Stotram',
          subtitle: 'Classical Stotram',
          category: 'stotram',
          description: 'The thousand sacred names of Lord Vishnu from the Mahabharata, chanted on Ekadashi.',
          url: '/bhakti/stotram/vishnu-sahasranama',
          badge: 'Devotional Chant',
        },
        {
          title: 'Complete Ekadashi Parana Guide',
          subtitle: 'Shastric Science',
          category: 'journal',
          description: 'Exact astronomical rules for Harivasara, sunrise parana windows, and diaspora timezones.',
          url: '/journal/the-complete-ekadashi-parana-guide-shastric-rules-and-timing',
          badge: 'Fasting Science',
        },
        {
          title: 'Today’s Panchang & Parana Windows',
          subtitle: 'Local Ephemeris',
          category: 'panchang',
          description: 'Check today’s local Tithi, sunrise, and exact fasting conclusion muhurta for your city.',
          url: '/panchang',
          badge: 'Daily Calendar',
        }
      );
      aiPrompts.push(
        'What is Harivasara in Ekadashi Parana timing?',
        'Why are grains avoided on Ekadashi according to Ayurveda?',
        'What is the spiritual significance of Mokshada vs Mohini Ekadashi?'
      );
      break;
    }

    case 'purnima': {
      links.push(
        {
          title: 'Satyanarayan Katha',
          subtitle: 'Full Moon Sacred Story',
          category: 'katha',
          description: 'The traditional narrative of truth, righteousness, and devotion chanted on Purnima evenings.',
          url: '/bhakti/katha/katha-satyanarayan',
          badge: 'Sacred Katha',
        },
        {
          title: 'Gayatri Mantra',
          subtitle: 'Universal Solar Meditation',
          category: 'stotram',
          description: 'The foundational Vedic prayer for intellect and illuminating inner awareness.',
          url: '/bhakti/stotram/gayatri-mantra',
          badge: 'Mantra Sadhana',
        },
        {
          title: 'Amavasya vs. Purnima: Lunar Polarities',
          subtitle: 'Cosmic Wisdom',
          category: 'journal',
          description: 'Navigating ancestral inward silence versus radiant expansion across lunar tides.',
          url: '/journal/amavasya-vs-purnima-navigating-lunar-polarities-and-consciousness',
          badge: 'Lunar Psychology',
        },
        {
          title: 'Moonrise & Tithi Timing',
          subtitle: 'Local Panchang',
          category: 'panchang',
          description: 'View today’s exact Purnima tithi span and local moonrise time for your location.',
          url: '/panchang',
          badge: 'Daily Calendar',
        }
      );
      aiPrompts.push(
        'Why is Satyanarayan Puja traditionally performed on Purnima?',
        'How does the full moon influence meditation and pranayama?',
        'What are the fasting rules for Satyanarayan Vrat?'
      );
      break;
    }

    case 'pradosh': {
      links.push(
        {
          title: 'Pradosh Vrat Katha',
          subtitle: 'Twilight Sacred Story',
          category: 'katha',
          description: 'The ancient narrative of Shiva relieving celestial suffering during the auspicious twilight sandhya.',
          url: '/bhakti/katha/katha-pradosh-vrat',
          badge: 'Sacred Katha',
        },
        {
          title: 'Shiva Panchakshara Stotram',
          subtitle: 'Shaiva Devotion',
          category: 'stotram',
          description: 'Adi Shankaracharya’s five-syllable hymn honoring the five elements and Lord Shiva.',
          url: '/bhakti/stotram/shiva-panchakshara',
          badge: 'Devotional Chant',
        },
        {
          title: 'Pradosh Vrat: The Twilight Window',
          subtitle: 'Muhurta Science',
          category: 'journal',
          description: 'Why the 90-minute window around sunset dissolves accumulated karma, and Shani Pradosh rules.',
          url: '/journal/pradosh-vrat-twilight-window-and-shani-pradosham',
          badge: 'Ritual Timing',
        },
        {
          title: 'Local Sunset & Pradosha Kaal',
          subtitle: 'Local Panchang',
          category: 'panchang',
          description: 'Calculate today’s exact twilight worship window based on local civil sunset.',
          url: '/panchang',
          badge: 'Daily Calendar',
        }
      );
      aiPrompts.push(
        'What is the exact formula for Pradosha Kaal timing?',
        'How does Som Pradosh differ from Shani Pradosh?',
        'What are the traditional phalahar rules for Pradosh fast?'
      );
      break;
    }

    case 'shivaratri': {
      links.push(
        {
          title: 'Masik Shivaratri Katha',
          subtitle: 'The Hunter’s Redemption',
          category: 'katha',
          description: 'How inadvertent Bilva leaf offerings and night vigilance transformed the hunter Lubdhaka.',
          url: '/bhakti/katha/katha-shivaratri',
          badge: 'Sacred Katha',
        },
        {
          title: 'Shiva Tandava Stotram',
          subtitle: 'Hymn of Power & Stillness',
          category: 'stotram',
          description: 'Ravana’s rhythmic Sanskrit masterpiece capturing Shiva’s cosmic dance.',
          url: '/bhakti/stotram/shiva-tandava',
          badge: 'Devotional Chant',
        },
        {
          title: 'Maha Shivratri: Nishita Kaal & Four Pahars',
          subtitle: 'Sacred Geometry',
          category: 'journal',
          description: 'The science of midnight Nishita Kaal and nocturnal four-pahar meditation.',
          url: '/journal/maha-shivratri-nishita-kaal-and-four-pahar-puja',
          badge: 'Astrometry Science',
        },
        {
          title: 'Local Nishita Kaal Muhurta',
          subtitle: 'Local Panchang',
          category: 'panchang',
          description: 'Determine the exact astronomical midnight window for your coordinates.',
          url: '/panchang',
          badge: 'Daily Calendar',
        }
      );
      aiPrompts.push(
        'What is Nishita Kaal and why is it potent for Shiva sadhana?',
        'What are the materials offered in each of the four pahars?',
        'What is the difference between Masik Shivaratri and Maha Shivaratri?'
      );
      break;
    }

    case 'chaturthi':
    case 'sankashti-chaturthi': {
      links.push(
        {
          title: 'Sankashti Chaturthi Katha',
          subtitle: 'Obstacle Removal Story',
          category: 'katha',
          description: 'The ancient narrative of King Chitrangada and Lord Ganesha liberating the distressed.',
          url: '/bhakti/katha/katha-sankashti-chaturthi',
          badge: 'Sacred Katha',
        },
        {
          title: 'Ganesha Pancharatnam',
          subtitle: 'Five Jewels of Ganesha',
          category: 'stotram',
          description: 'Adi Shankaracharya’s beloved prayer honoring the remover of obstacles.',
          url: '/bhakti/stotram/ganesha-pancharatnam',
          badge: 'Devotional Chant',
        },
        {
          title: 'Madhyahna Sthapana & Chandra Darshan',
          subtitle: 'Shastric Protocol',
          category: 'journal',
          description: 'The astronomical science of Ganesha puja and the Mithya Dosha of sighting the moon.',
          url: '/journal/ganesh-chaturthi-madhyahna-sthapana-and-chandra-darshan-dosha',
          badge: 'Ritual Science',
        },
        {
          title: 'Sankashti Moonrise Time',
          subtitle: 'Local Panchang',
          category: 'panchang',
          description: 'Check today’s local moonrise time required to break the Sankashti fast.',
          url: '/panchang',
          badge: 'Daily Calendar',
        }
      );
      aiPrompts.push(
        'Why is the fast broken only after sighting the moon on Sankashti Chaturthi?',
        'How does Vinayaka Chaturthi differ from Sankashti Chaturthi?',
        'What is the story behind Chandra Darshan Dosha on Chaturthi?'
      );
      break;
    }

    case 'amavasya': {
      links.push(
        {
          title: 'Amavasya Katha — The King’s Dream',
          subtitle: 'Ancestral Remembrance',
          category: 'katha',
          description: 'The tale of filial duty, ancestral peace, and the transformative power of shraddha offerings.',
          url: '/bhakti/katha/katha-amavasya-tarpan',
          badge: 'Sacred Katha',
        },
        {
          title: 'Aditya Hrudaya Stotram',
          subtitle: 'Solar Radiance Hymn',
          category: 'stotram',
          description: 'Sage Agastya’s hymn to Lord Rama invoking eternal vitality and clarity of vision.',
          url: '/bhakti/stotram/aditya-hrudaya',
          badge: 'Devotional Chant',
        },
        {
          title: 'Pitru Paksha & Ancestral Tarpan',
          subtitle: 'Bio-Spiritual Lineage',
          category: 'journal',
          description: 'The sacred science of ancestral resonance, water offerings, and Kutapa Kaal.',
          url: '/journal/pitru-paksha-and-mahalaya-ancestral-tarpan-science',
          badge: 'Lineage Science',
        },
        {
          title: 'Aparahna & Tithi Conclusion',
          subtitle: 'Local Panchang',
          category: 'panchang',
          description: 'Find local solar noon and afternoon Kutapa Kaal windows for ancestral rites.',
          url: '/panchang',
          badge: 'Daily Calendar',
        }
      );
      aiPrompts.push(
        'Why is Amavasya considered the primary day for ancestral remembrance?',
        'What is Kutapa Kaal and why is it chosen for Tarpan?',
        'What is the scriptural foundation of Pinda Daan?'
      );
      break;
    }

    case 'somvar': {
      links.push(
        {
          title: 'Pradosh & Somvar Shaiva Katha',
          subtitle: 'Shaiva Sacred Story',
          category: 'katha',
          description: 'The classic narrative of Shiva’s grace during Monday fasts and twilight sadhana.',
          url: '/bhakti/katha/katha-pradosh-vrat',
          badge: 'Sacred Katha',
        },
        {
          title: 'Mahamrityunjaya Mantra',
          subtitle: 'Healing & Liberation',
          category: 'stotram',
          description: 'The Rigvedic prayer for overcoming mortal fear and awakening spiritual immortality.',
          url: '/bhakti/stotram/mahamrityunjaya-mantra',
          badge: 'Mantra Sadhana',
        },
        {
          title: 'Dietary Purity & Ayurvedic Fasting',
          subtitle: 'Sattva & Langhana',
          category: 'journal',
          description: 'How mindful intermittent fasting enhances mental clarity, sattvic awareness, and cellular renewal.',
          url: '/journal/dietary-purity-and-the-science-of-fasting-ayurvedic-autophagy',
          badge: 'Fasting Science',
        },
        {
          title: 'Today’s Tithi & Rahu Kaal',
          subtitle: 'Local Panchang',
          category: 'panchang',
          description: 'Check today’s inauspicious and auspicious muhurtas for beginning your practice.',
          url: '/panchang',
          badge: 'Daily Calendar',
        }
      );
      aiPrompts.push(
        'What are the recommended dietary rules for Somvar Vrat?',
        'Why is Monday dedicated to Lord Shiva in tradition?',
        'What is the difference between regular Somvar and Solah Somvar Vrat?'
      );
      break;
    }

    case 'puranmashi': {
      links.push(
        {
          title: 'Sacha Sauda — The True Bargain',
          subtitle: 'Sikh Sakhi',
          category: 'katha',
          description: 'Guru Nanak Dev Ji feeding starving sadhus, demonstrating that selfless service is the highest investment.',
          url: '/bhakti/katha/sakhi-guru-nanak-sacha-sauda',
          badge: 'Sacred Sakhi',
        },
        {
          title: 'Japji Sahib (Complete Text)',
          subtitle: 'Morning Nitnem',
          category: 'stotram',
          description: 'Guru Nanak’s magnum opus on the nature of reality, divine order (Hukam), and spiritual ascent.',
          url: '/bhakti/stotram/japji-sahib-full',
          badge: 'Sacred Gurbani',
        },
        {
          title: 'Seva as Stillness: Art of Presence',
          subtitle: 'Living Practice',
          category: 'journal',
          description: 'How unconditional selfless service quietens the restless ego and grounds spiritual life.',
          url: '/journal/seva-as-stillness-unconditional-presence',
          badge: 'Living Seva',
        },
        {
          title: 'Sikh Tradition & Heritage',
          subtitle: 'Path Overview',
          category: 'tradition',
          description: 'Explore the core foundations of the Sikh Panth, Gurpurabs, and daily Nitnem rhythms.',
          url: '/traditions/sikh',
          badge: 'Tradition Overview',
        }
      );
      aiPrompts.push(
        'What is the spiritual significance of Puranmashi in Sikh tradition?',
        'How does Guru Nanak explain Hukam in Japji Sahib?',
        'What is the concept of Vand Chhako in daily life?'
      );
      break;
    }

    case 'uposatha': {
      links.push(
        {
          title: 'The Uposatha — King and the Monk',
          subtitle: 'Buddhist Moral Story',
          category: 'katha',
          description: 'How a day of simple living and the Eight Precepts transformed King Pasenadi’s consciousness.',
          url: '/bhakti/katha/dhamma-uposatha-story',
          badge: 'Dhamma Tale',
        },
        {
          title: 'Mangala Sutta',
          subtitle: 'The Greatest Blessings',
          category: 'stotram',
          description: 'The Buddha’s definitive discourse on the 38 blessings that lead to peace and enlightenment.',
          url: '/bhakti/stotram/mangala-sutta',
          badge: 'Pali Chanting',
        },
        {
          title: 'Metta: Radical Psychology of Loving-Kindness',
          subtitle: 'Buddhist Practice',
          category: 'journal',
          description: 'Developing unconditional friendliness toward all beings as a direct antidote to reactive anger.',
          url: '/journal/metta-in-age-of-reaction',
          badge: 'Mindfulness',
        },
        {
          title: 'Buddhist Tradition & Dhamma',
          subtitle: 'Path Overview',
          category: 'tradition',
          description: 'Explore the Four Noble Truths, the Noble Eightfold Path, and living mindfulness.',
          url: '/traditions/buddhist',
          badge: 'Tradition Overview',
        }
      );
      aiPrompts.push(
        'What are the Eight Precepts observed by lay Buddhists on Uposatha days?',
        'What is the meaning of Bhavana in Buddhist meditation?',
        'How does Metta practice transform daily stress and conflict?'
      );
      break;
    }

    default: {
      links.push(
        {
          title: 'Today’s Panchang & Muhurta',
          subtitle: 'Local Ephemeris',
          category: 'panchang',
          description: 'View today’s local Tithi, Nakshatra, and sunrise timings calculated for your coordinates.',
          url: '/panchang',
          badge: 'Daily Calendar',
        },
        {
          title: 'The Rhythm of Sacred Time',
          subtitle: 'Panchang Wisdom',
          category: 'journal',
          description: 'Understanding the five cosmic limbs of time beyond popular astrology.',
          url: '/journal/rhythm-of-sacred-time-panchang',
          badge: 'Panchang Science',
        }
      );
      aiPrompts.push(
        `What are the historical fasting guidelines for ${vrat?.name || 'this observance'}?`,
        'How does local sunrise determine the calendar day in Vedic astrometry?'
      );
    }
  }

  return {
    heading: `Connected Wisdom & Living Practice for ${vrat?.name || 'this Vrat'}`,
    description: `Explore the scriptural story, accompanying devotional hymns, and astronomical guidelines for ${vrat?.name || 'this observance'}.`,
    links,
    aiPrompts,
  };
}

/**
 * Returns verified contextual wisdom links and AI prompts for a sacred Katha story.
 */
export function getRelatedWisdomForKatha(kathaId: string): RelatedWisdomPayload {
  const katha = getKathaById(kathaId);
  const links: RelatedWisdomLink[] = [];
  const aiPrompts: string[] = [];

  const title = katha?.title || 'this Sacred Story';
  const tradition = katha?.tradition || 'hindu';
  const occasion = katha?.occasion || 'general';

  // 1. Link to corresponding Vrat if occasion matches
  if (occasion === 'ekadashi') {
    links.push({
      title: 'Ekadashi Vrat Rules & Parana',
      subtitle: 'Associated Fasting Guide',
      category: 'vrat',
      description: 'The complete guide to Ekadashi fasting, dietary restrictions, and exact parana conclusion windows.',
      url: '/vrat/ekadashi',
      badge: 'Living Vrat',
    });
    links.push({
      title: 'Vishnu Sahasranama Stotram',
      subtitle: 'Classical Hymn',
      category: 'stotram',
      description: 'Chant the thousand sacred names of Lord Vishnu traditionally recited alongside this katha.',
      url: '/bhakti/stotram/vishnu-sahasranama',
      badge: 'Devotional Chant',
    });
  } else if (occasion === 'purnima') {
    links.push({
      title: 'Purnima Vrat & Puja Guide',
      subtitle: 'Associated Fasting Guide',
      category: 'vrat',
      description: 'Guidelines for observing Purnima, Satyanarayan puja, and full moon meditation.',
      url: '/vrat/purnima',
      badge: 'Living Vrat',
    });
  } else if (occasion === 'pradosh') {
    links.push({
      title: 'Pradosh Vrat & Twilight Puja',
      subtitle: 'Associated Fasting Guide',
      category: 'vrat',
      description: 'Understanding the sacred twilight sandhya window and evening Shiva worship.',
      url: '/vrat/pradosh',
      badge: 'Living Vrat',
    });
  } else if (occasion === 'shivaratri') {
    links.push({
      title: 'Masik Shivaratri Guide',
      subtitle: 'Associated Fasting Guide',
      category: 'vrat',
      description: 'Nishita Kaal meditation rules and four-pahar worship guidelines.',
      url: '/vrat/shivaratri',
      badge: 'Living Vrat',
    });
  } else if (occasion === 'chaturthi') {
    links.push({
      title: 'Chaturthi Fasting & Moonrise Rules',
      subtitle: 'Associated Fasting Guide',
      category: 'vrat',
      description: 'Complete guidelines for Vinayaka and Sankashti Chaturthi observances.',
      url: '/vrat/chaturthi',
      badge: 'Living Vrat',
    });
  } else if (tradition === 'buddhist') {
    links.push({
      title: 'Uposatha Observance Guide',
      subtitle: 'Buddhist Living Practice',
      category: 'vrat',
      description: 'The Eight Precepts and mindfulness practices observed during Buddhist sacred days.',
      url: '/vrat/uposatha',
      badge: 'Living Practice',
    });
    links.push({
      title: 'Buddham Saranam Gacchami',
      subtitle: 'Triple Gem Refuge',
      category: 'stotram',
      description: 'The ancient Pali chanting taking refuge in the Buddha, Dhamma, and Sangha.',
      url: '/bhakti/stotram/buddham-saranam',
      badge: 'Pali Chanting',
    });
    links.push({
      title: 'Buddhist Tradition Overview',
      subtitle: 'Philosophical Lineage',
      category: 'tradition',
      description: 'Explore the Four Noble Truths, the Noble Eightfold Path, and living mindfulness.',
      url: '/traditions/buddhist',
      badge: 'Tradition Overview',
    });
  } else if (tradition === 'jain') {
    links.push({
      title: 'Namokar Mantra',
      subtitle: 'Supreme Reverence',
      category: 'stotram',
      description: 'The foundational Jain prayer offering reverence to the Arihantas, Siddhas, and all liberated souls.',
      url: '/bhakti/stotram/namokar-mantra',
      badge: 'Prakrit Chanting',
    });
    links.push({
      title: 'Bhaktamar Stotra',
      subtitle: 'Devotional Masterpiece',
      category: 'stotram',
      description: 'Acharya Manatunga’s celebrated hymn of praise to Lord Adinatha.',
      url: '/bhakti/stotram/bhaktamar-stotra',
      badge: 'Jain Stotra',
    });
    links.push({
      title: 'Jain Dharma Overview',
      subtitle: 'Philosophical Lineage',
      category: 'tradition',
      description: 'Explore Ahimsa, Anekantavada, Aparigraha, and the path of the 24 Tirthankaras.',
      url: '/traditions/jain',
      badge: 'Tradition Overview',
    });
  } else if (tradition === 'sikh') {
    links.push({
      title: 'Puranmashi Observance',
      subtitle: 'Sikh Living Practice',
      category: 'vrat',
      description: 'Sacred full moon reflections and Gurbani contemplation in the Sikh Panth.',
      url: '/vrat/puranmashi',
      badge: 'Living Practice',
    });
    links.push({
      title: 'Japji Sahib (Complete Text)',
      subtitle: 'Morning Nitnem',
      category: 'stotram',
      description: 'Guru Nanak’s foundational bani on divine order, truth, and spiritual consciousness.',
      url: '/bhakti/stotram/japji-sahib-full',
      badge: 'Sacred Gurbani',
    });
    links.push({
      title: 'Sikh Panth Overview',
      subtitle: 'Philosophical Lineage',
      category: 'tradition',
      description: 'Explore the living wisdom of Guru Granth Sahib Ji, Mool Mantar, and Seva.',
      url: '/traditions/sikh',
      badge: 'Tradition Overview',
    });
  } else {
    // General Sanatan story
    links.push(
      {
        title: 'Today’s Panchang & Sacred Time',
        subtitle: 'Local Ephemeris',
        category: 'panchang',
        description: 'See today’s local Tithi, Nakshatra, and Muhurta calculated for your coordinates.',
        url: '/panchang',
        badge: 'Daily Calendar',
      },
      {
        title: 'Sanatan Dharma Overview',
        subtitle: 'Philosophical Lineage',
        category: 'tradition',
        description: 'Explore the Vedas, Upanishads, Bhagavad Gita, and living dharmic paths.',
        url: '/traditions/hindu',
        badge: 'Tradition Overview',
      }
    );
  }

  // Always include a relevant journal essay if not already at 4 items
  if (links.length < 4) {
    links.push({
      title: 'The Rhythm of Sacred Time',
      subtitle: 'Wisdom Essay',
      category: 'journal',
      description: 'Understanding how classical cycles of time support steady inner growth and sadhana.',
      url: '/journal/rhythm-of-sacred-time-panchang',
      badge: 'Wisdom Journal',
    });
  }

  // Contextual Dharma Mitra prompts
  aiPrompts.push(
    `What is the deeper moral and philosophical lesson of "${title}"?`,
    `How does this story relate to karma and personal sadhana in daily life?`,
    `What scriptural text or tradition first recorded this sacred narrative?`
  );

  return {
    heading: `Connected Wisdom & Practice: ${title}`,
    description: `Deepen your understanding through the philosophical roots, living observances, and accompanying devotional chants related to this story.`,
    links: links.slice(0, 4),
    aiPrompts: aiPrompts.slice(0, 3),
  };
}
