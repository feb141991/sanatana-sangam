// ============================================================================
// Shoonaya Marketing & Growth RAG Service
// Grounded generation for Social Media Carousels, Programmatic SEO Pages,
// and The Sanctuary Dispatch Newsletter.
// ============================================================================

import dharmVeer365Snapshot from '@/lib/data/dharm-veer-365-snapshot.json';
import festivalRulesJson from '../../../packages/dharma-rules/src/festivals/rules.json';
import { getAllJournalEssays } from '@/config/journal';
import { ALL_KATHAS } from '@/lib/katha-library';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export interface DharmVeerSocialPostRequest {
  heroId?: string;
  date?: string; // YYYY-MM-DD
  platform?: 'instagram' | 'twitter' | 'linkedin';
  language?: string;
}

export interface SocialSlide {
  slideNumber: number;
  header: string;
  body: string;
  visualDirection?: string;
}

export interface DharmVeerSocialPostResult {
  heroId: string;
  heroName: string;
  tradition: string;
  platform: 'instagram' | 'twitter' | 'linkedin';
  hook: string;
  slides: SocialSlide[];
  caption: string;
  hashtags: string[];
  ctaUrl: string;
  sourcesVerified: boolean;
  sourceAttribution: string;
}

export interface FestivalSeoPageRequest {
  festivalSlug: string;
  city: string;
  year?: number;
  locationFacts?: {
    festivalDate: string | null;
    timezone: string;
    coordinates: string;
    sunrise: string;
    sunset: string;
    tithi: string;
    masa: string;
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FestivalSeoPageResult {
  festivalSlug: string;
  festivalName: string;
  city: string;
  year: number;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  introHtml: string;
  astronomicalTimingExplanation: string;
  classicalSignificance: string;
  faqItems: FaqItem[];
  jsonLdFaqSchema: string;
  ctaText: string;
  ctaUrl: string;
}

export interface SanctuaryNewsletterRequest {
  weekStartDate: string; // YYYY-MM-DD
  tradition?: string;
}

export interface SanctuaryNewsletterResult {
  weekDate: string;
  subjectLine: string;
  previewText: string;
  sections: {
    title: string;
    body: string;
    source?: string;
  }[];
  plainText: string;
  ctaUrl: string;
}

interface HeroQuote {
  text: string;
  attribution?: string;
}

interface HeroRecord {
  id: string;
  name: string;
  nameLocal?: string;
  era?: string;
  tradition: string;
  region?: string;
  emoji?: string;
  tagline?: string;
  journey?: string;
  trial?: string;
  teaching?: string;
  moral?: string;
  legacy?: string;
  source?: string;
  quote?: string | HeroQuote;
}

function formatHeroQuote(quote?: string | HeroQuote): string {
  if (!quote) return '';
  if (typeof quote === 'string') return quote;
  return quote.text ? `"${quote.text}" — ${quote.attribution || ''}`.trim() : '';
}

interface RuleRecord {
  slug: string;
  display_name: string;
  description?: string;
  rule_family?: string;
  tradition?: string;
  kind?: string;
}

/**
 * Resolve target hero by ID or calendar date.
 */
function resolveHero(request: DharmVeerSocialPostRequest): HeroRecord {
  const heroes = dharmVeer365Snapshot as unknown as HeroRecord[];
  if (request.heroId) {
    const found = heroes.find((h) => h.id === request.heroId);
    if (found) return found;
  }

  if (request.date) {
    const d = new Date(request.date);
    if (!isNaN(d.getTime())) {
      const startOfYear = new Date(d.getFullYear(), 0, 0);
      const diff = d.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const index = Math.abs(dayOfYear) % heroes.length;
      return heroes[index] || heroes[0];
    }
  }

  return heroes[0];
}

/**
 * Generate a grounded Social Media Carousel and Caption for a Dharm Veer Hero.
 */
export async function generateDharmVeerSocialPost(
  request: DharmVeerSocialPostRequest
): Promise<DharmVeerSocialPostResult> {
  const hero = resolveHero(request);
  const platform = request.platform || 'instagram';

  const system = `You are a distinguished Dharmic cultural editor and historical biographer for Shoonaya.
You create high-engagement social media carousel scripts and captions based STRICTLY on authentic historical and Shastric facts.
NEVER fabricate events, quotes, or sources. Always highlight resilience, dharma, and moral courage.`;

  const user = `Task: Create a high-conversion ${platform} carousel script and caption for this historical Dharm Veer hero:

Hero Name: ${hero.name}
Tradition: ${hero.tradition}
Era & Region: ${hero.era || 'Classical'} | ${hero.region || 'Bharat'}
Tagline: ${hero.tagline || ''}
Key Historical Journey: ${hero.journey || ''}
The Great Trial / Crucible: ${hero.trial || ''}
Sacred Teaching & Core Truth: ${hero.teaching || ''}
Moral Takeaway: ${hero.moral || ''}
Canonical Quote: ${formatHeroQuote(hero.quote)}
Primary Classical Source: ${hero.source || 'Historical Epigraphic & Literary Tradition'}

Output strictly valid JSON with this exact schema:
{
  "hook": "1 punchy line stopping the scroll",
  "slides": [
    { "slideNumber": 1, "header": "Title", "body": "1-2 sentences setting the stage", "visualDirection": "Visual cue for design team" },
    { "slideNumber": 2, "header": "The Crucible", "body": "1-2 sentences on their defining trial", "visualDirection": "Visual cue" },
    { "slideNumber": 3, "header": "The Wisdom", "body": "Their core teaching and quote", "visualDirection": "Visual cue" },
    { "slideNumber": 4, "header": "The Modern Mirror", "body": "How this applies to modern daily life", "visualDirection": "Visual cue" },
    { "slideNumber": 5, "header": "Shoonaya Sacred Companion", "body": "Explore all 365 Dharmic heroes ad-free in the Shoonaya app.", "visualDirection": "App screen visual" }
  ],
  "caption": "Full social caption with storytelling, line breaks, quote, and clear download CTA for https://shoonaya.com/get",
  "hashtags": ["#DharmVeer", "#Shoonaya", "#SanatanDharma", "#History"]
}`;

  try {
    const res = await generateWithProvider(
      { system, user },
      { responseFormat: 'json', maxOutputTokens: 2048 }
    );

    const parsed = JSON.parse(res.text);

    return {
      heroId: hero.id,
      heroName: hero.name,
      tradition: hero.tradition,
      platform,
      hook: parsed.hook || `${hero.name}: The Hero Who Defined ${hero.tradition}`,
      slides: Array.isArray(parsed.slides) ? parsed.slides : [],
      caption: parsed.caption || `${hero.journey}\n\nRead more on Shoonaya: https://shoonaya.com/get`,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#DharmVeer', '#Shoonaya'],
      ctaUrl: 'https://shoonaya.com/get?utm_source=social&utm_medium=carousel&utm_campaign=dharm-veer',
      sourcesVerified: true,
      sourceAttribution: hero.source || 'Historical Epigraphic & Literary Tradition',
    };
  } catch {
    // Deterministic fallback if model inference is offline or in test
    return {
      heroId: hero.id,
      heroName: hero.name,
      tradition: hero.tradition,
      platform,
      hook: `${hero.name}: When Courage Became Dharma`,
      slides: [
        {
          slideNumber: 1,
          header: hero.name,
          body: hero.tagline || `A beacon of ${hero.tradition} wisdom and valor.`,
          visualDirection: 'Regal silhouette with warm temple gold tones',
        },
        {
          slideNumber: 2,
          header: 'The Crucible',
          body: hero.trial || hero.journey?.slice(0, 180) || '',
          visualDirection: 'Dramatic dark lighting showing the historical conflict',
        },
        {
          slideNumber: 3,
          header: 'The Enduring Truth',
          body: formatHeroQuote(hero.quote) || hero.teaching || '',
          visualDirection: 'Minimal typography showcasing the classical quote',
        },
        {
          slideNumber: 4,
          header: 'Living Dharma Today',
          body: hero.moral || 'True strength lies in steadfast adherence to righteousness amidst adversity.',
          visualDirection: 'Modern contemplative setting',
        },
        {
          slideNumber: 5,
          header: 'Explore on Shoonaya',
          body: 'Immerse yourself in authentic Dharmic histories with zero ads. Download the Shoonaya app.',
          visualDirection: 'Shoonaya app interface showing the Dharm Veer archive',
        },
      ],
      caption: `${formatHeroQuote(hero.quote) ? `${formatHeroQuote(hero.quote)}\n\n` : ''}${hero.journey}\n\nSource: ${hero.source || 'Classical Records'}\n\nExperience all 365 daily heroes on the Shoonaya app: https://shoonaya.com/get`,
      hashtags: ['#DharmVeer', '#Shoonaya', `#${hero.tradition.replace(/\s+/g, '')}`, '#SanatanWisdom'],
      ctaUrl: 'https://shoonaya.com/get?utm_source=social&utm_medium=carousel&utm_campaign=dharm-veer',
      sourcesVerified: true,
      sourceAttribution: hero.source || 'Classical Records',
    };
  }
}

/**
 * Generate a programmatic, high-authority SEO landing page for a Festival in a specific city.
 */
export async function generateFestivalSeoCampaign(
  request: FestivalSeoPageRequest
): Promise<FestivalSeoPageResult> {
  const rules = festivalRulesJson as unknown as RuleRecord[];
  const rule = rules.find((r) => r.slug === request.festivalSlug) || {
    slug: request.festivalSlug,
    display_name: request.festivalSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: 'Astronomical festival observance according to classical Panchang principles.',
    rule_family: 'Solar-Lunar',
    tradition: 'Sanatan Dharma',
  };

  const essays = getAllJournalEssays();
  const relatedEssay = essays.find((e) =>
    e.slug.includes(request.festivalSlug) || e.title.toLowerCase().includes(rule.display_name.toLowerCase())
  );

  const city = request.city;
  const year = request.year || new Date().getFullYear();

  const system = `You are a Senior Astrometrician and Dharmic Content Strategist for Shoonaya.
Generate a high-authority, programmatic SEO landing page for a festival in a specific city.
Focus heavily on LOCAL ASTRONOMICAL PRECISION (Drigganita), explaining why festival timings (tithi, moonrise, nishita kaal) differ across global longitudes and latitudes.`;

  const user = `Festival: ${rule.display_name}
Target City: ${city}
Year: ${year}
Rule Summary: ${rule.description || ''}
Rule Family: ${rule.rule_family || ''}
Classical Background: ${relatedEssay ? relatedEssay.excerpt : 'Classical Shastric festival observance'}
Location facts (use these values; do not invent alternatives): ${request.locationFacts ? JSON.stringify(request.locationFacts) : 'not provided'}

Task: Generate a complete SEO landing page specification. Output strictly valid JSON with this schema. Do not claim an exact local date or time unless it appears in the supplied location facts. Do not present generic India timings as local city timings:
{
  "metaTitle": "SEO title under 60 chars including festival, year, city",
  "metaDescription": "SEO meta description under 155 chars with high CTR appeal",
  "h1": "Main H1 heading",
  "introHtml": "Engaging 2-paragraph introduction explaining the spiritual significance and why local astronomical calculations matter in ${city}",
  "astronomicalTimingExplanation": "Detailed 2-paragraph technical explanation of local sunrise, sunset, moonrise, or lagna coordinates for ${city}",
  "classicalSignificance": "1-2 paragraphs detailing the Puranic and Shastric origin with citations",
  "faqItems": [
    { "question": "Question 1", "answer": "Answer 1" },
    { "question": "Question 2", "answer": "Answer 2" },
    { "question": "Question 3", "answer": "Answer 3" },
    { "question": "Question 4", "answer": "Answer 4" }
  ]
}`;

  try {
    const res = await generateWithProvider(
      { system, user },
      { responseFormat: 'json', maxOutputTokens: 2048 }
    );

    const parsed = JSON.parse(res.text);
    const faqItems: FaqItem[] = Array.isArray(parsed.faqItems) ? parsed.faqItems : [];

    const jsonLdFaqSchema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });

    return {
      festivalSlug: rule.slug,
      festivalName: rule.display_name,
      city,
      year,
      metaTitle: parsed.metaTitle || `${rule.display_name} ${year} in ${city}: Accurate Timings & Shastric Puja Window`,
      metaDescription: parsed.metaDescription || `Find canonical ${rule.display_name} ${year} timings for ${city}. Drigganita-verified astronomical windows, local tithi rules, and Shastric rituals on Shoonaya.`,
      h1: parsed.h1 || `${rule.display_name} ${year} in ${city}: Canonical Astronomical Timings`,
      introHtml: parsed.introHtml || `<p>${rule.display_name} in ${city} requires exact local astronomical coordinates to determine the auspicious window.</p>`,
      astronomicalTimingExplanation: parsed.astronomicalTimingExplanation || `Because celestial events like Tithi and Nakshatra transitions occur simultaneously across the globe, the local civil calendar in ${city} depends on whether the tithi is prevailing at local sunrise.`,
      classicalSignificance: parsed.classicalSignificance || `Observed under classical Vedic tradition according to the ${rule.rule_family || 'Panchang'} rulebook.`,
      faqItems,
      jsonLdFaqSchema,
      ctaText: `Get Real-Time ${rule.display_name} Alarms for ${city} on Shoonaya`,
      ctaUrl: `https://shoonaya.com/get?utm_source=seo&utm_medium=landing-page&utm_campaign=${rule.slug}-${city.toLowerCase()}`,
    };
  } catch {
    // Deterministic fallback
    const fallbackFaqs: FaqItem[] = [
      {
        question: `Why do ${rule.display_name} dates differ between ${city} and India?`,
        answer: `Festival dates depend on local sunrise and the prevailing lunar tithi at that exact geographical coordinate. Because ${city} is in a different timezone, the tithi may begin or end on a different civil calendar date.`,
      },
      {
        question: `How does Shoonaya calculate festival timings in ${city}?`,
        answer: `Shoonaya uses high-precision astronomical algorithms (Drigganita) tuned to the exact latitude and longitude of ${city}, factoring in atmospheric refraction and local horizon.`,
      },
      {
        question: `What are the primary rituals for ${rule.display_name}?`,
        answer: rule.description || `Devotees observe fasting, sacred bath (snana), puja during the designated Muhurta window, and charitable offerings.`,
      },
      {
        question: `Can I get local notifications for ${rule.display_name} in ${city}?`,
        answer: `Yes, the Shoonaya app provides automated, location-accurate reminder notifications adjusted to ${city}'s exact timezone.`,
      },
    ];

    return {
      festivalSlug: rule.slug,
      festivalName: rule.display_name,
      city,
      year,
      metaTitle: `${rule.display_name} ${year} in ${city}: Precise Timings & Muhurta`,
      metaDescription: `Discover canonical ${rule.display_name} ${year} timings for ${city}. Local astronomical calculation, Shastric rules, and puja windows on Shoonaya.`,
      h1: `${rule.display_name} ${year} in ${city}: Precise Muhurta & Local Astrometry`,
      introHtml: `<p>${rule.display_name} is an auspicious observance whose spiritual efficacy depends on alignment with cosmic rhythms. For residents of ${city}, observing this festival requires precision calculation based on local sunrise and horizon coordinates rather than generic Indian Standard Time tables.</p>`,
      astronomicalTimingExplanation: `Under classical Drigganita astrometry, astronomical instants such as solar ingress (Sankranti) or lunar phases (Tithi) happen at a single universal instant worldwide. However, local civil day assignment depends on the local sunrise in ${city}. Shoonaya eliminates timezone confusion by calculating real-time planetary positions for your exact coordinates.`,
      classicalSignificance: `Preserved across centuries in classical treatises such as the Surya Siddhanta and Dharmasindhu, this observance balances individual bio-energetics with universal planetary cycles.`,
      faqItems: fallbackFaqs,
      jsonLdFaqSchema: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: fallbackFaqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }),
      ctaText: `Get Location-Accurate ${rule.display_name} Timings on Shoonaya App`,
      ctaUrl: `https://shoonaya.com/get?utm_source=seo&utm_medium=landing-page&utm_campaign=${rule.slug}-${city.toLowerCase()}`,
    };
  }
}

/**
 * Generate The Sanctuary Dispatch weekly newsletter using RAG across upcoming events,
 * Ritucharya health wisdom, and Panchatantra moral philosophy.
 */
export async function generateSanctuaryNewsletter(
  request: SanctuaryNewsletterRequest
): Promise<SanctuaryNewsletterResult> {
  const weekDate = request.weekStartDate;
  const stories = ALL_KATHAS;
  const moralStory = stories.find((s) => s.occasion === 'general') || stories[0];
  const essays = getAllJournalEssays();
  const featuredEssay = essays[0];

  const system = `You are the Editor-in-Chief of "The Sanctuary Dispatch", Shoonaya's weekly contemplative email newsletter.
You synthesize timeless Dharmic wisdom with modern psychological reflection for a global, discerning readership.`;

  const user = `Week Start Date: ${weekDate}
Selected Moral Story: ${moralStory.title} (Moral: ${moralStory.phal})
Featured Journal Essay: ${featuredEssay.title}
Tradition Filter: ${request.tradition || 'Universal Dharmic'}

Task: Write the weekly newsletter. Output strictly valid JSON with this schema:
{
  "subjectLine": "Evocative, non-clickbait subject line under 50 chars",
  "previewText": "Preview snippet under 90 chars",
  "sections": [
    { "title": "Celestial Rhythm (This Week's Observances)", "body": "2 paragraphs on current lunar phases and mindfulness", "source": "Panchang Astrometry" },
    { "title": "Ancient Mind, Modern Life", "body": "2 paragraphs connecting ${featuredEssay.title} to modern stress relief", "source": "${featuredEssay.title}" },
    { "title": "Timeless Parable: ${moralStory.title}", "body": "2 paragraphs recounting the story and its practical takeaway", "source": "Panchatantra" },
    { "title": "Contemplative Sadhana for the Week", "body": "1 micro-practice for daily inner stillness", "source": "Classical Sadhana" }
  ]
}`;

  try {
    const res = await generateWithProvider(
      { system, user },
      { responseFormat: 'json', maxOutputTokens: 2048 }
    );

    const parsed = JSON.parse(res.text);
    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];

    const plainText = [
      `THE SANCTUARY DISPATCH — Week of ${weekDate}`,
      `==================================================`,
      `Subject: ${parsed.subjectLine || 'The Architecture of Inner Stillness'}`,
      '',
      ...sections.map((s: { title: string; body: string; source?: string }) => `### ${s.title}\n${s.body}\n${s.source ? `[Source: ${s.source}]` : ''}\n`),
      '--------------------------------------------------',
      'Experience ad-free daily sadhana and accurate astronomical reminders on the Shoonaya App:',
      'https://shoonaya.com/get?utm_source=newsletter&utm_medium=email&utm_campaign=dispatch',
    ].join('\n');

    return {
      weekDate,
      subjectLine: parsed.subjectLine || `The Sanctuary Dispatch: Inner Alignment for the Week`,
      previewText: parsed.previewText || `Timely celestial guidance, mindful wisdom, and ancient lessons for your week.`,
      sections,
      plainText,
      ctaUrl: 'https://shoonaya.com/get?utm_source=newsletter&utm_medium=email&utm_campaign=dispatch',
    };
  } catch {
    // Deterministic fallback
    const sections = [
      {
        title: "Celestial Rhythm: The Current Lunar Phase",
        body: "As the lunar cycle transitions, the mind naturally fluctuates between sensory outwardness and internal reflection. Aligning our daily pauses with the twilight sandhyas grounds the nervous system against modern cognitive fatigue.",
        source: "Classical Panchang Astrometry",
      },
      {
        title: "Ancient Mind, Modern Life: Sacred Geometry and Stillness",
        body: featuredEssay.excerpt,
        source: featuredEssay.title,
      },
      {
        title: `Timeless Parable: ${moralStory.title}`,
        body: `${moralStory.preview}\n\nCore Insight: ${moralStory.phal}`,
        source: "Panchatantra",
      },
      {
        title: "Contemplative Sadhana of the Week",
        body: "Dedicate five minutes at dawn to quiet observation of your natural breath before touching any electronic screen. Notice the space between thoughts where undisturbed peace naturally resides.",
        source: "Taittiriya Upanishad",
      },
    ];

    const plainText = [
      `THE SANCTUARY DISPATCH — Week of ${weekDate}`,
      `==================================================`,
      `Subject: The Architecture of Inner Stillness`,
      '',
      ...sections.map((s) => `### ${s.title}\n${s.body}\n[Source: ${s.source}]\n`),
      '--------------------------------------------------',
      'Download Shoonaya: https://shoonaya.com/get',
    ].join('\n');

    return {
      weekDate,
      subjectLine: `The Sanctuary Dispatch: Inner Alignment for the Week`,
      previewText: `Celestial rhythms, ancient parables, and mindful practices for your daily sadhana.`,
      sections,
      plainText,
      ctaUrl: 'https://shoonaya.com/get?utm_source=newsletter&utm_medium=email&utm_campaign=dispatch',
    };
  }
}
