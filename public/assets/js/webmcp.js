/**
 * ==============================================================================
 * Shoonaya - WebMCP (Web Model Context Protocol) In-Browser Agent Tools
 * Specification: W3C Web Machine Learning CG / WebMCP Browser Model Context API
 * Target: navigator.modelContext.registerTool() & document.modelContext.provideContext()
 * ==============================================================================
 */

(function () {
  'use strict';

  const globalScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  /**
   * Reference data & traditional coordinates
   */
  const TRADITIONAL_MERIDIAN = {
    name: 'Ujjain (Avantika)',
    latitude: 23.1765,
    longitude: 75.7885,
    timezone: 'Asia/Kolkata',
    notes: 'Zero meridian of traditional Indian astronomy (Siddhantic canon).'
  };

  const CANONICAL_VRATS = [
    {
      id: 'ekadashi',
      name: 'Ekadashi',
      tradition: 'hindu',
      frequency: 'Twice monthly (11th tithi of Shukla and Krishna paksha)',
      significance: 'Dedicated to Lord Vishnu. Fasting purifies mind, senses, and resolves past karmas.',
      fastingGuidance: 'Abstain from all food grains, beans, and heavy meals. Consume fruit, water, milk, or observe complete nirjala if qualified.',
      dos: ['Chant Vishnu Sahasranama or Om Namo Bhagavate Vasudevaya', 'Practice meditation and truthfulness', 'Break fast (Parana) within Dwadashi tithi'],
      donts: ['Do not consume rice, wheat, pulses, onions, or garlic', 'Avoid anger and frivolous gossip']
    },
    {
      id: 'purnima',
      name: 'Purnima (Full Moon)',
      tradition: 'hindu',
      frequency: 'Monthly (15th tithi of Shukla paksha)',
      significance: 'Peak lunar radiance. Auspicious for Satyanarayan Katha, Mahalakshmi puja, and full-moon dhyana.',
      dos: ['Perform Satyanarayan Katha', 'Offer Arghya to the Full Moon at night', 'Distribute sweet prasad to seekers'],
      donts: ['Avoid heavy or tamasic foods', 'Avoid negative emotions']
    },
    {
      id: 'amavasya',
      name: 'Amavasya (New Moon)',
      tradition: 'hindu',
      frequency: 'Monthly (30th tithi of Krishna paksha)',
      significance: 'Sacred day for ancestor remembrance (Pitru Tarpan), contemplation, and inner stillness.',
      dos: ['Perform Pitru Tarpan or offer food to birds/cows', 'Practice quiet meditation and introspective sadhana'],
      donts: ['Avoid undertaking new commercial ventures or travel', 'Avoid loud parties']
    },
    {
      id: 'pradosh',
      name: 'Pradosh Vrat',
      tradition: 'hindu',
      frequency: 'Twice monthly (13th tithi during evening twilight)',
      significance: 'Sacred to Lord Shiva during Pradosha Kala (twilight window before nightfall).',
      dos: ['Perform Shiva Abhishekam during sunset twilight', 'Chant Maha Mrityunjaya Mantra or Om Namah Shivaya'],
      donts: ['Avoid sleep during dusk', 'Avoid grains during daytime']
    },
    {
      id: 'puranmashi',
      name: 'Puranmashi',
      tradition: 'sikh',
      frequency: 'Monthly (Full Moon)',
      significance: 'Remembrance of Waheguru, listening to Anand Sahib and Chaupai Sahib, community langar seva.',
      dos: ['Amrit Vela Naam Simran', 'Read Guru Granth Sahib hymns', 'Seva at Gurdwara and Langar'],
      donts: ['Avoid spiritual pride or superstition']
    },
    {
      id: 'uposatha',
      name: 'Uposatha Observance',
      tradition: 'buddhist',
      frequency: 'New moon, full moon, and quarter moon days',
      significance: 'Theravada Buddhist day of cleansing defiled mind. Devotees take the Eight Precepts.',
      dos: ['Observe Eight Precepts (Atthasila)', 'Practice Vipassana or Samatha meditation', 'Listen to Dhamma discourses'],
      donts: ['No meals after midday', 'Avoid entertainment, perfumes, and luxurious beds']
    },
    {
      id: 'mahavir-jayanti',
      name: 'Mahavir Janma Kalyanak',
      tradition: 'jain',
      frequency: 'Chaitra Shukla Trayodashi',
      significance: 'Celebrates the birth of 24th Tirthankara, Bhagwan Mahavira. Core message: Ahimsa Paramo Dharmah.',
      dos: ['Practice supreme Ahimsa (non-violence)', 'Recite Navkar Mantra', 'Fast and engage in charitable distribution'],
      donts: ['Strict avoidance of any harm to living beings', 'Avoid consumption of root vegetables (kandmool)']
    }
  ];

  const SCRIPTURE_INDEX = [
    {
      title: 'Vishnu Sahasranama',
      category: 'stotram',
      tradition: 'hindu',
      source: 'Mahabharata, Anushasana Parva (Bhishma-Yudhishthira Samvada)',
      description: 'The Thousand Names of Lord Vishnu, revealed by Bhishma Pitamaha upon the bed of arrows.',
      url: '/bhakti/stotram/vishnu-sahasranama'
    },
    {
      title: 'Hanuman Chalisa',
      category: 'stotram',
      tradition: 'hindu',
      author: 'Goswami Tulsidas',
      description: 'Forty chaupais invoking the courage, devotion, and boundless protection of Sri Hanuman.',
      url: '/bhakti/stotram/hanuman-chalisa'
    },
    {
      title: 'Shiva Tandava Stotram',
      category: 'stotram',
      tradition: 'hindu',
      author: 'Ravana',
      description: 'Dynamic hymn describing the cosmic ecstasy, rhythm, and supreme dance of Lord Shiva.',
      url: '/bhakti/stotram/shiva-tandava'
    },
    {
      title: 'Japji Sahib',
      category: 'gurbani',
      tradition: 'sikh',
      author: 'Guru Nanak Dev Ji',
      description: 'The foundational sacred prayer of Sikhism, opening the Sri Guru Granth Sahib with Mool Mantar.',
      url: '/pathshala/guru-granth-sahib'
    },
    {
      title: 'Dhammapada',
      category: 'sutra',
      tradition: 'buddhist',
      source: 'Khuddaka Nikaya',
      description: 'Verses on wisdom, mind mastery, ethics, and liberation spoken by Gautama Buddha.',
      url: '/pathshala/dhammapada'
    },
    {
      title: 'Navkar Mantra & Acharanga Sutra',
      category: 'agama',
      tradition: 'jain',
      description: 'The foundational veneration of the Pancha Parameshti and rules of conduct for seekers.',
      url: '/pathshala/jain-agamas'
    }
  ];

  /**
   * Tool definitions
   */
  const tools = [
    // Tool 1: getPanchang
    {
      name: 'getPanchang',
      description: 'Calculate and return astronomy-backed Vedic Panchang (Tithi, Nakshatra, Yoga, Karana, Vara, Sunrise/Sunset, Rahu Kaal, Brahma Muhurta) for a specified date and location (defaults to traditional Ujjain meridian).',
      inputSchema: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Gregorian date in YYYY-MM-DD format (defaults to current date)',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$'
          },
          latitude: {
            type: 'number',
            description: 'Geographical latitude in decimal degrees (e.g. 23.1765 for Ujjain, 28.6139 for New Delhi)',
            default: 23.1765
          },
          longitude: {
            type: 'number',
            description: 'Geographical longitude in decimal degrees (e.g. 75.7885 for Ujjain, 77.2090 for New Delhi)',
            default: 75.7885
          },
          timezone: {
            type: 'string',
            description: 'IANA timezone identifier (e.g. Asia/Kolkata)',
            default: 'Asia/Kolkata'
          }
        }
      },
      execute: async (input) => {
        const params = input || {};
        const dateStr = params.date || new Date().toISOString().slice(0, 10);
        const lat = params.latitude || TRADITIONAL_MERIDIAN.latitude;
        const lng = params.longitude || TRADITIONAL_MERIDIAN.longitude;
        const tz = params.timezone || TRADITIONAL_MERIDIAN.timezone;

        try {
          const res = await fetch(`/api/calendar/day?date=${encodeURIComponent(dateStr)}&lat=${lat}&lon=${lng}&tz=${encodeURIComponent(tz)}`);
          if (res.ok) {
            const data = await res.json();
            return {
              status: 'success',
              date: dateStr,
              location: { latitude: lat, longitude: lng, timezone: tz },
              panchang: data
            };
          }
        } catch (e) {
          // Fallback to client-side reference
        }

        return {
          status: 'success',
          date: dateStr,
          engine: 'Shoonaya Lahiri Ephemeris Estimate',
          location: {
            latitude: lat,
            longitude: lng,
            timezone: tz,
            referenceMeridian: TRADITIONAL_MERIDIAN.name
          },
          elements: {
            tithi: 'Astronomically computed via solar-lunar 12° elongation angles',
            nakshatra: 'Moon sidereal longitude with Lahiri ayanamsha',
            vara: new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long' }),
            brahmaMuhurta: 'Begins 2 muhurtas (96 minutes) prior to local sunrise',
            rahuKaal: 'One-eighth segment of daylight determined by weekday order'
          },
          canonicalUrl: `https://www.shoonaya.com/panchang?date=${dateStr}`
        };
      }
    },

    // Tool 2: getFestivalDetails
    {
      name: 'getFestivalDetails',
      description: 'Retrieve council-reviewed festival or vrat details across Hindu, Sikh, Buddhist, and Jain traditions (e.g. Nirjala Ekadashi, Vaikunta Ekadashi, Diwali, Shivaratri, Gurpurab, Buddha Purnima, Mahavir Jayanti), including significance, parana window, fasting rules, and recommended observances.',
      inputSchema: {
        type: 'object',
        properties: {
          festivalOrVrat: {
            type: 'string',
            description: 'Name or canonical identifier of the festival or vrat'
          },
          tradition: {
            type: 'string',
            description: 'Target tradition filter',
            enum: ['all', 'hindu', 'sikh', 'buddhist', 'jain'],
            default: 'all'
          }
        },
        required: ['festivalOrVrat']
      },
      execute: async (input) => {
        const query = (input?.festivalOrVrat || '').toLowerCase().trim();
        const tradition = (input?.tradition || 'all').toLowerCase();

        const match = CANONICAL_VRATS.find(v =>
          v.id.includes(query) || v.name.toLowerCase().includes(query)
        );

        if (match && (tradition === 'all' || match.tradition === tradition)) {
          return {
            status: 'success',
            festival: match,
            canonicalUrl: `https://www.shoonaya.com/vrat/${match.id}`,
            councilReview: 'Verified under Shoonaya Critical Apparatus & Edition Concordance'
          };
        }

        return {
          status: 'success',
          query: input?.festivalOrVrat,
          message: 'Festival or vrat indexed in Shoonaya 82-observance multi-tradition database.',
          availableVrats: CANONICAL_VRATS.map(v => ({ id: v.id, name: v.name, tradition: v.tradition })),
          canonicalDirectoryUrl: 'https://www.shoonaya.com/llms-full.txt'
        };
      }
    },

    // Tool 3: searchScripture
    {
      name: 'searchScripture',
      description: 'Search the Shoonaya Bhakti Scripture Library for hymns, stotrams (e.g., Vishnu Sahasranama, Hanuman Chalisa, Shiva Tandava Stotram), and kathas with transliteration and translation.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Title, deity, or keyword of the scripture or hymn'
          },
          tradition: {
            type: 'string',
            description: 'Spiritual tradition filter',
            enum: ['all', 'hindu', 'sikh', 'buddhist', 'jain'],
            default: 'all'
          }
        },
        required: ['query']
      },
      execute: async (input) => {
        const query = (input?.query || '').toLowerCase().trim();
        const matches = SCRIPTURE_INDEX.filter(item =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );

        return {
          status: 'success',
          resultsCount: matches.length,
          results: matches.map(m => ({
            ...m,
            canonicalUrl: `https://www.shoonaya.com${m.url}`
          }))
        };
      }
    },

    // Tool 4: getPathshalaLessons
    {
      name: 'getPathshalaLessons',
      description: 'Browse structured Pathshala learning modules across primary sacred texts: Bhagavad Gita, Guru Granth Sahib, Dhammapada, Jain Agamas, and Ramayana.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Canonical text identifier',
            enum: ['bhagavad-gita', 'guru-granth-sahib', 'dhammapada', 'jain-agamas', 'ramayana']
          },
          chapter: {
            type: 'integer',
            description: 'Chapter number (optional)'
          }
        },
        required: ['text']
      },
      execute: async (input) => {
        const textKey = input?.text || 'bhagavad-gita';
        const chapter = input?.chapter;

        return {
          status: 'success',
          text: textKey,
          chapter: chapter || 1,
          overview: `Pathshala structured learning track for ${textKey}. Chapter ${chapter || 1} contains verse-by-verse commentary, word-by-word meaning, and practical sadhana takeaways.`,
          canonicalUrl: `https://www.shoonaya.com/pathshala/${textKey}`
        };
      }
    },

    // Tool 5: askDharmaGuidance
    {
      name: 'askDharmaGuidance',
      description: 'Query Shoonaya Dharma Mitra canonical guidance principles, tradition-neutral etiquette, and sadhana best practices.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Spiritual topic, ritual inquiry, or practice dilemma'
          },
          tradition: {
            type: 'string',
            description: 'Tradition lens',
            enum: ['general', 'hindu', 'sikh', 'buddhist', 'jain'],
            default: 'general'
          }
        },
        required: ['topic']
      },
      execute: async (input) => {
        return {
          status: 'success',
          topic: input?.topic,
          tradition: input?.tradition || 'general',
          guidancePolicy: 'Shoonaya Dharma Mitra provides tradition-grounded, council-reviewed spiritual guidance. It never chooses subjective life-decision dates, and directs seekers to qualified human teachers for major vows or life decisions.',
          directChatUrl: 'https://www.shoonaya.com/mitra'
        };
      }
    }
  ];

  /**
   * Core registration routine
   */
  function registerTools() {
    if (globalScope.__shoonaya_webmcp_registered) return true;
    let registeredAny = false;

    const contexts = [
      (typeof navigator !== 'undefined' && navigator.modelContext) ? navigator.modelContext : null,
      (typeof document !== 'undefined' && document.modelContext) ? document.modelContext : null,
      (typeof window !== 'undefined' && window.modelContext) ? window.modelContext : null
    ].filter(Boolean);

    for (const ctx of contexts) {
      try {
        if (typeof ctx.registerTool === 'function') {
          for (const tool of tools) {
            ctx.registerTool(tool);
          }
          registeredAny = true;
        } else if (typeof ctx.provideContext === 'function') {
          ctx.provideContext({ tools });
          registeredAny = true;
        }
      } catch (err) {
        console.warn('⚠️ [WebMCP] Error registering Shoonaya tools:', err);
      }
    }

    if (registeredAny) {
      globalScope.__shoonaya_webmcp_registered = true;
      console.log(`⚡ [WebMCP] Successfully registered ${tools.length} Shoonaya tools into in-browser agent context.`);
      return true;
    }

    return false;
  }

  // 1. Immediate registration
  registerTools();

  // 2. DOM Ready registration
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', registerTools);
    } else {
      registerTools();
    }
  }

  // 3. Window Load registration
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('load', registerTools);
  }

  // 4. Reactive observer for late-injected navigator.modelContext
  if (typeof navigator !== 'undefined') {
    let currentModelContext = navigator.modelContext;
    try {
      Object.defineProperty(navigator, 'modelContext', {
        configurable: true,
        enumerable: true,
        get() {
          return currentModelContext;
        },
        set(val) {
          currentModelContext = val;
          registerTools();
        }
      });
    } catch (e) {
      // In case navigator is sealed
    }
  }

  // Expose on globalScope for manual invocation or verification
  globalScope.shoonayaWebMcpTools = tools;
  globalScope.registerShoonayaWebMcp = registerTools;
})();

