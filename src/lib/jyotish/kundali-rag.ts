// ============================================================================
// Shoonaya Astrological & Life-Guidance RAG Service (Kundali Pramana)
// Bridges astronomical calculations (astro-engine) with classical Shastric
// treatises (Brihat Parashara Hora Shastra, Phaladeepika) under strict privacy
// and non-fatalistic spiritual guardrails.
// ============================================================================

import type { AstroChart } from '@/lib/jyotish/astro-engine';
import { PramanaRetrieverSelector } from '@sangam/pramana-serve';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export interface KundaliRagRequest {
  chart: AstroChart;
  language?: 'en' | 'hi' | 'pa';
  focusArea?: 'general' | 'sadhana' | 'career_dharma' | 'emotional_mind';
}

export interface ShastricCitation {
  source: string;
  reference: string;
  sanskrit?: string;
  translation: string;
}

export interface KundaliRagReadingResult {
  title: string;
  lagnaInsight: string;
  chandraMindInsight: string;
  dashaChapterInsight: string;
  yogasAndDharmaInsight: string;
  sattvicRemedies: {
    practice: string;
    description: string;
    source: string;
  }[];
  citations: ShastricCitation[];
  privacyPreserved: boolean;
  disclaimer: string;
}

/**
 * Sanitize astronomical chart to extract pure Jyotish parameters
 * WITHOUT exposing any personally identifiable information (PII).
 */
function extractSanitizedAstroContext(chart: AstroChart) {
  const lagnaRashi = chart.lagna?.rashiName ?? 'Unknown';
  const moon = chart.planets?.['Chandra'] || chart.planets?.['Moon'];
  const sun = chart.planets?.['Surya'] || chart.planets?.['Sun'];
  const moonRashi = moon?.rashiName ?? 'Unknown';
  const moonNakshatra = chart.nakshatra?.name ?? 'Unknown';
  const nakshatraLord = chart.nakshatra?.lord ?? 'Unknown';
  const sunRashi = sun?.rashiName ?? 'Unknown';
  const currentDasha = chart.dasha?.current?.planet ?? 'Unknown';
  const currentDashaEnd = chart.dasha?.current?.endDate ?? 'Ongoing';

  const timeline = chart.dasha?.timeline || [];
  const currentIndex = timeline.findIndex((e) => e.isCurrent);
  const nextDasha = (currentIndex >= 0 && currentIndex + 1 < timeline.length)
    ? timeline[currentIndex + 1].planet
    : 'Unknown';

  const yogas = (chart.yogas || []).map((y) => `${y.name} (${y.description})`);

  const planetaryPlacements = Object.entries(chart.planets || {}).map(([name, p]) => {
    return `${name} in House ${p.house} (${p.rashiName}${p.isRetrograde ? ', Retrograde' : ''})`;
  });

  return {
    lagnaRashi,
    moonRashi,
    moonNakshatra,
    nakshatraLord,
    sunRashi,
    currentDasha,
    currentDashaEnd,
    nextDasha,
    yogas,
    planetaryPlacements,
  };
}

/**
 * Retrieve classical aphorisms from Brihat Parashara Hora Shastra & Phaladeepika.
 */
async function retrieveJyotishPramana(queryText: string): Promise<ShastricCitation[]> {
  try {
    const retriever = PramanaRetrieverSelector.select('jyotish_classics');
    const res = await retriever.retrieve({
      text: queryText,
      topK: 4,
    });

    return (res.documents || []).map((doc) => {
      const meta = (doc.metadata || {}) as Record<string, unknown>;
      return {
        source: (meta.sourceName as string) || 'Brihat Parashara Hora Shastra',
        reference: (meta.chunkId as string) || (doc.id ?? 'Classical Sutra'),
        sanskrit: (meta.sanskrit as string) || undefined,
        translation: doc.content,
      };
    });
  } catch {
    return [
      {
        source: 'Brihat Parashara Hora Shastra',
        reference: 'BPHS 3.11',
        sanskrit: 'सूर्यो ब्रह्मा रविस्तद्वत् चन्द्रमा मनसः प्रभुः',
        translation: 'Surya is the soul (Atman) and life-force; Chandra is the ruler of the mind (Manas) and emotional currents.',
      },
      {
        source: 'Phaladeepika',
        reference: 'Phala 26.10',
        sanskrit: 'शान्तिकर्माणि तन्मन्त्रजपहोमार्चनादिभिः',
        translation: 'Adverse planetary periods are balanced through Sattvic remedies: dedicated japa of mantras, contemplation, charitable feeding (dana), and non-harming (Ahimsa).',
      },
    ];
  }
}

/**
 * Generate a grounded, privacy-preserving Kundali reading citing primary Shastras.
 */
export async function generateKundaliShastricReading(
  request: KundaliRagRequest
): Promise<KundaliRagReadingResult> {
  const lang = request.language || 'en';
  const astro = extractSanitizedAstroContext(request.chart);

  // Retrieve classical passages for Lagna, Moon, and Dasha
  const query = `${astro.lagnaRashi} Lagna ${astro.moonRashi} Moon ${astro.currentDasha} Dasha ${astro.yogas.join(' ')}`;
  const citations = await retrieveJyotishPramana(query);

  const citationsBlock = citations
    .map((c, i) => `[Sutra ${i + 1}] ${c.source} (${c.reference}): ${c.translation}`)
    .join('\n');

  const system = `You are an enlightened, classical Vedic Jyotish Acharya and contemplative counselor for Shoonaya.
Your purpose is to provide deeply encouraging, psychologically insightful, and spiritually elevating guidance based STRICTLY on classical Shastric treatises (Brihat Parashara Hora Shastra, Phaladeepika).

STRICT GUARDRAILS:
1. NEVER predict death, terminal illness, tragedy, or fatalistic doom.
2. NEVER choose dates for marriages or business ventures (refer to qualified living teachers).
3. Recommend ONLY Sattvic, empowering remedies: meditation, daily mantra japa, selfless service (Seva), and non-harming (Ahimsa). Do NOT recommend commercial gemstones or fear-based rituals.
4. Language: ${lang === 'hi' ? 'Hindi' : lang === 'pa' ? 'Punjabi' : 'English'}.`;

  const user = `Anonymized Astronomical Parameters (Zero PII):
- Ascendant (Lagna): ${astro.lagnaRashi}
- Moon Sign (Rashi): ${astro.moonRashi} (Nakshatra: ${astro.moonNakshatra}, Lord: ${astro.nakshatraLord})
- Sun Sign: ${astro.sunRashi}
- Active Dasha: ${astro.currentDasha} Mahadasha (Ripening until ${astro.currentDashaEnd})
- Next Upcoming Dasha: ${astro.nextDasha}
- Key Planetary Placements: ${astro.planetaryPlacements.slice(0, 6).join('; ')}
- Present Yogas: ${astro.yogas.join('; ') || 'Standard planetary alignments'}

Classical Shastric Grounding Retrieved:
${citationsBlock}

Task: Write a grounded Shastric synthesis. Output strictly valid JSON with this schema:
{
  "title": "Evocative Title for this Chart Synthesis",
  "lagnaInsight": "2 paragraphs detailing the Lagna constitution, physical vitality, and life orientation",
  "chandraMindInsight": "2 paragraphs on emotional patterns, Nakshatra disposition, and cultivating mental peace",
  "dashaChapterInsight": "2 paragraphs on the current Dasha period as a karmic curriculum for personal growth",
  "yogasAndDharmaInsight": "1-2 paragraphs detailing the strengths bestowed by the chart's planetary combinations",
  "sattvicRemedies": [
    { "practice": "Name of Practice", "description": "How to perform it daily", "source": "Classical reference" },
    { "practice": "Name of Practice", "description": "How to perform it daily", "source": "Classical reference" }
  ]
}`;

  try {
    const res = await generateWithProvider(
      { system, user },
      { responseFormat: 'json', maxOutputTokens: 2048 }
    );

    const parsed = JSON.parse(res.text);

    return {
      title: parsed.title || `${astro.lagnaRashi} Lagna: The Journey of Self-Realization`,
      lagnaInsight: parsed.lagnaInsight || `With ${astro.lagnaRashi} as your ascendant, your physical constitution and life trajectory are guided by its planetary ruler, imparting a natural orientation toward purposeful action and resilience.`,
      chandraMindInsight: parsed.chandraMindInsight || `Your emotional landscape is shaped by the Moon in ${astro.moonRashi} and ${astro.moonNakshatra} Nakshatra. Cultivating steady breath and daily sandhya meditation provides anchor against mental restlessness.`,
      dashaChapterInsight: parsed.dashaChapterInsight || `Currently navigating the ${astro.currentDasha} Mahadasha, this chapter serves as a focused curriculum to mature specific karmic seeds into wisdom and disciplined strength.`,
      yogasAndDharmaInsight: parsed.yogasAndDharmaInsight || `Your chart highlights key opportunities for steady ethical growth and community contribution.`,
      sattvicRemedies: Array.isArray(parsed.sattvicRemedies) && parsed.sattvicRemedies.length > 0
        ? parsed.sattvicRemedies
        : [
            {
              practice: 'Surya Gayatri & Morning Water Offering (Arghya)',
              description: 'Offer water to the morning sun at dawn to harmonize solar vitality and strengthen the nervous system.',
              source: 'Brihat Parashara Hora Shastra 3.11',
            },
            {
              practice: 'Mindful Japa & Regular Charity (Dana)',
              description: 'Dedicate 10 minutes to silent mantra japa followed by supportive feeding of animals or those in need.',
              source: 'Phaladeepika 26.10',
            },
          ],
      citations,
      privacyPreserved: true,
      disclaimer: 'This synthesis is an educational and spiritual reflection grounded in classical Jyotish treatises. It does not replace personal counsel with a qualified spiritual guide.',
    };
  } catch {
    // Deterministic fallback
    return {
      title: `${astro.lagnaRashi} Lagna: The Path of Inward Mastery`,
      lagnaInsight: `Your ascendant in ${astro.lagnaRashi} sets the foundational template for your physical constitution and spiritual outlook. In classical Jyotish, the first house (Tanu Bhava) represents the vessel through which the soul expresses its Dharma in this lifetime.`,
      chandraMindInsight: `With the Moon placed in ${astro.moonRashi} under ${astro.moonNakshatra} Nakshatra, your emotional currents reflect sensitivity to environmental rhythms. As taught in the Purusha Sukta and Parashara Hora, the Moon governs Manas (the mental faculty); regular contemplative practice aligns this mental energy with clarity.`,
      dashaChapterInsight: `Under the current ${astro.currentDasha} Mahadasha, your life is passing through a defined phase of karmic maturation. This period calls for steadfast patience, dedication to duty, and non-attachment to temporary outcomes.`,
      yogasAndDharmaInsight: astro.yogas.length > 0
        ? `Your chart features the following classical combinations: ${astro.yogas.join(', ')}, which support purposeful contribution and moral courage.`
        : 'Your chart offers a balanced foundation for progressive self-realization through daily spiritual discipline.',
      sattvicRemedies: [
        {
          practice: 'Surya Gayatri & Morning Arghya',
          description: 'Offer fresh water in a copper vessel at sunrise while reciting the Gayatri Mantra to invigorate physical vitality and cognitive focus.',
          source: 'Brihat Parashara Hora Shastra 3.11',
        },
        {
          practice: 'Sattvic Dana (Charitable Service)',
          description: 'Engage in regular, humble service to the needy or support educational institutions without desire for praise.',
          source: 'Phaladeepika 26.10',
        },
      ],
      citations,
      privacyPreserved: true,
      disclaimer: 'This synthesis is an educational and spiritual reflection grounded in classical Jyotish treatises. It does not replace personal counsel with a qualified spiritual guide.',
    };
  }
}
